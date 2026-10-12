CREATE TYPE public.app_role AS ENUM ('student','faculty','finance');
CREATE TYPE public.claim_status AS ENUM ('draft','submitted','under_review','changes_requested','rejected','approved');
CREATE TYPE public.expense_category AS ENUM ('stationery','refreshment','rent','design_material','printing','travel','equipment','other');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;
CREATE OR REPLACE FUNCTION public.is_staff(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role IN ('faculty','finance'))
$$;

CREATE POLICY "Users read own roles; finance reads all" ON public.user_roles FOR SELECT TO authenticated
USING (user_id = auth.uid() OR public.has_role(auth.uid(),'finance'));

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  email text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read own profile or staff" ON public.profiles FOR SELECT TO authenticated
USING (id = auth.uid() OR public.is_staff(auth.uid()));
CREATE POLICY "Update own profile" ON public.profiles FOR UPDATE TO authenticated
USING (id = auth.uid()) WITH CHECK (id = auth.uid());

CREATE TABLE public.students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prn text NOT NULL UNIQUE,
  full_name text NOT NULL,
  department text NOT NULL,
  year text NOT NULL,
  division text NOT NULL,
  email text NOT NULL UNIQUE,
  user_id uuid UNIQUE,
  is_demo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.students TO authenticated;
GRANT ALL ON public.students TO service_role;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.current_student_id()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT id FROM public.students WHERE user_id = auth.uid() LIMIT 1
$$;

CREATE POLICY "Students read own record; staff read all" ON public.students FOR SELECT TO authenticated
USING (user_id = auth.uid() OR public.is_staff(auth.uid()));
CREATE POLICY "Finance inserts students" ON public.students FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(),'finance'));
CREATE POLICY "Finance updates students" ON public.students FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(),'finance')) WITH CHECK (public.has_role(auth.uid(),'finance'));

-- Versioned beneficiary profiles: every change is a new row (audit history)
CREATE TABLE public.beneficiary_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  version int NOT NULL,
  account_holder text NOT NULL,
  bank_name text NOT NULL,
  account_identifier text NOT NULL,
  ifsc text NOT NULL,
  is_current boolean NOT NULL DEFAULT true,
  change_note text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (student_id, version)
);
CREATE UNIQUE INDEX beneficiary_one_current ON public.beneficiary_profiles(student_id) WHERE is_current;
GRANT SELECT, INSERT ON public.beneficiary_profiles TO authenticated;
GRANT ALL ON public.beneficiary_profiles TO service_role;
ALTER TABLE public.beneficiary_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own beneficiary or staff" ON public.beneficiary_profiles FOR SELECT TO authenticated
USING (student_id = public.current_student_id() OR public.is_staff(auth.uid()));
CREATE POLICY "Finance inserts beneficiary" ON public.beneficiary_profiles FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(),'finance'));

CREATE TABLE public.advances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  purpose text NOT NULL,
  amount numeric(12,2) NOT NULL CHECK (amount > 0),
  applied_amount numeric(12,2) NOT NULL DEFAULT 0 CHECK (applied_amount >= 0),
  issued_on date NOT NULL DEFAULT current_date,
  recorded_by uuid,
  version int NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (applied_amount <= amount)
);
GRANT SELECT ON public.advances TO authenticated;
GRANT ALL ON public.advances TO service_role;
ALTER TABLE public.advances ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own advances or staff" ON public.advances FOR SELECT TO authenticated
USING (student_id = public.current_student_id() OR public.is_staff(auth.uid()));

CREATE SEQUENCE public.claim_number_seq START 1001;
CREATE TABLE public.claims (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  claim_no text NOT NULL UNIQUE DEFAULT ('CLM-' || nextval('public.claim_number_seq')::text),
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  title text NOT NULL,
  purpose text NOT NULL,
  status public.claim_status NOT NULL DEFAULT 'draft',
  total_claimed numeric(12,2),
  total_approved numeric(12,2),
  advance_id uuid REFERENCES public.advances(id),
  assigned_faculty uuid,
  version int NOT NULL DEFAULT 1,
  revision int NOT NULL DEFAULT 1,
  created_by uuid NOT NULL,
  submitted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.claims TO authenticated;
GRANT ALL ON public.claims TO service_role;
ALTER TABLE public.claims ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own claims or staff read" ON public.claims FOR SELECT TO authenticated
USING (student_id = public.current_student_id() OR public.is_staff(auth.uid()));
CREATE POLICY "Students create own drafts" ON public.claims FOR INSERT TO authenticated
WITH CHECK (student_id = public.current_student_id() AND status = 'draft' AND created_by = auth.uid()
  AND total_claimed IS NULL AND total_approved IS NULL AND advance_id IS NULL AND assigned_faculty IS NULL);
CREATE POLICY "Students edit own drafts" ON public.claims FOR UPDATE TO authenticated
USING (student_id = public.current_student_id() AND status IN ('draft','changes_requested'))
WITH CHECK (student_id = public.current_student_id() AND status IN ('draft','changes_requested'));
CREATE POLICY "Students delete own drafts" ON public.claims FOR DELETE TO authenticated
USING (student_id = public.current_student_id() AND status = 'draft');

-- Prevent students changing protected columns via direct updates
CREATE OR REPLACE FUNCTION public.protect_claim_columns()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF current_user = 'authenticated' THEN
    IF NEW.status IS DISTINCT FROM OLD.status
       OR NEW.total_claimed IS DISTINCT FROM OLD.total_claimed
       OR NEW.total_approved IS DISTINCT FROM OLD.total_approved
       OR NEW.advance_id IS DISTINCT FROM OLD.advance_id
       OR NEW.assigned_faculty IS DISTINCT FROM OLD.assigned_faculty
       OR NEW.version IS DISTINCT FROM OLD.version
       OR NEW.revision IS DISTINCT FROM OLD.revision
       OR NEW.student_id IS DISTINCT FROM OLD.student_id
       OR NEW.submitted_at IS DISTINCT FROM OLD.submitted_at
       OR NEW.claim_no IS DISTINCT FROM OLD.claim_no THEN
      RAISE EXCEPTION 'Protected claim fields can only change through the workflow service';
    END IF;
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END $$;
CREATE TRIGGER claims_protect BEFORE UPDATE ON public.claims FOR EACH ROW EXECUTE FUNCTION public.protect_claim_columns();

CREATE TABLE public.expense_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  claim_id uuid NOT NULL REFERENCES public.claims(id) ON DELETE CASCADE,
  position int NOT NULL DEFAULT 0,
  description text NOT NULL,
  vendor_name text,
  category public.expense_category NOT NULL DEFAULT 'other',
  expense_date date NOT NULL,
  claimed_amount numeric(12,2) NOT NULL,
  approved_amount numeric(12,2),
  reduction_reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.expense_items TO authenticated;
GRANT ALL ON public.expense_items TO service_role;
ALTER TABLE public.expense_items ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.can_edit_claim(_claim_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.claims c WHERE c.id = _claim_id
    AND c.student_id = public.current_student_id() AND c.status IN ('draft','changes_requested'))
$$;
CREATE OR REPLACE FUNCTION public.can_view_claim(_claim_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.claims c WHERE c.id = _claim_id
    AND (c.student_id = public.current_student_id() OR public.is_staff(auth.uid())))
$$;

CREATE POLICY "View items of visible claims" ON public.expense_items FOR SELECT TO authenticated
USING (public.can_view_claim(claim_id));
CREATE POLICY "Insert items on editable claims" ON public.expense_items FOR INSERT TO authenticated
WITH CHECK (public.can_edit_claim(claim_id) AND approved_amount IS NULL);
CREATE POLICY "Update items on editable claims" ON public.expense_items FOR UPDATE TO authenticated
USING (public.can_edit_claim(claim_id)) WITH CHECK (public.can_edit_claim(claim_id) AND approved_amount IS NULL);
CREATE POLICY "Delete items on editable claims" ON public.expense_items FOR DELETE TO authenticated
USING (public.can_edit_claim(claim_id));

CREATE TABLE public.claim_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  claim_id uuid NOT NULL REFERENCES public.claims(id) ON DELETE CASCADE,
  actor_id uuid,
  action text NOT NULL,
  from_status public.claim_status,
  to_status public.claim_status,
  comment text,
  java_trace text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.claim_events TO authenticated;
GRANT ALL ON public.claim_events TO service_role;
ALTER TABLE public.claim_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View events of visible claims" ON public.claim_events FOR SELECT TO authenticated
USING (public.can_view_claim(claim_id));

-- Atomic, version-checked transition, callable only by the server (service role)
CREATE OR REPLACE FUNCTION public.apply_claim_transition(
  _claim_id uuid, _expected_version int, _to_status public.claim_status,
  _total_claimed numeric, _actor uuid, _action text, _comment text, _java_trace text)
RETURNS int LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _from public.claim_status; _new_version int;
BEGIN
  SELECT status INTO _from FROM public.claims WHERE id = _claim_id FOR UPDATE;
  UPDATE public.claims SET status = _to_status,
    total_claimed = COALESCE(_total_claimed, total_claimed),
    submitted_at = CASE WHEN _to_status = 'submitted' THEN now() ELSE submitted_at END,
    version = version + 1
  WHERE id = _claim_id AND version = _expected_version
  RETURNING version INTO _new_version;
  IF _new_version IS NULL THEN
    RAISE EXCEPTION 'VERSION_CONFLICT' USING ERRCODE = 'P0409';
  END IF;
  INSERT INTO public.claim_events(claim_id, actor_id, action, from_status, to_status, comment, java_trace)
  VALUES (_claim_id, _actor, _action, _from, _to_status, _comment, _java_trace);
  RETURN _new_version;
END $$;
REVOKE ALL ON FUNCTION public.apply_claim_transition(uuid,int,public.claim_status,numeric,uuid,text,text,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.apply_claim_transition(uuid,int,public.claim_status,numeric,uuid,text,text,text) TO service_role;

-- Signup: profile + student role + link to student record by email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles(id, full_name, email)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', NEW.email)
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.user_roles(user_id, role) VALUES (NEW.id, 'student') ON CONFLICT DO NOTHING;
  UPDATE public.students SET user_id = NEW.id WHERE lower(email) = lower(NEW.email) AND user_id IS NULL;
  RETURN NEW;
END $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Fictional demo data
INSERT INTO public.students (prn, full_name, department, year, division, email) VALUES
 ('DEMO-IT-001','Aarav Kulkarni','Information Technology','Second Year','B','aarav.demo@example.com'),
 ('DEMO-IT-002','Meera Joshi','Information Technology','Second Year','B','meera.demo@example.com'),
 ('DEMO-IT-003','Rohan Deshmukh','Information Technology','Second Year','A','rohan.demo@example.com'),
 ('DEMO-IT-004','Isha Patil','Information Technology','Third Year','B','isha.demo@example.com');
INSERT INTO public.beneficiary_profiles (student_id, version, account_holder, bank_name, account_identifier, ifsc, change_note)
SELECT id, 1, full_name, 'Demo Bank of Pune', 'DEMO000000' || right(prn,3), 'DEMO0000' || right(prn,3), 'Initial fictional demo profile'
FROM public.students;
INSERT INTO public.advances (student_id, purpose, amount)
SELECT id, 'Tech fest stall materials', 2000.00 FROM public.students WHERE prn = 'DEMO-IT-001';