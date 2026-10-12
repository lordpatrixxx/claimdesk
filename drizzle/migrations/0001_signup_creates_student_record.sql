CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _linked int;
BEGIN
  INSERT INTO public.profiles(id, full_name, email)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', NEW.email)
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.user_roles(user_id, role) VALUES (NEW.id, 'student') ON CONFLICT DO NOTHING;
  UPDATE public.students SET user_id = NEW.id WHERE lower(email) = lower(NEW.email) AND user_id IS NULL;
  GET DIAGNOSTICS _linked = ROW_COUNT;
  IF _linked = 0 AND COALESCE(NEW.raw_user_meta_data->>'prn','') <> ''
     AND NOT EXISTS (SELECT 1 FROM public.students WHERE prn = NEW.raw_user_meta_data->>'prn') THEN
    INSERT INTO public.students(prn, full_name, department, year, division, email, user_id, is_demo)
    VALUES (left(NEW.raw_user_meta_data->>'prn',30),
            left(COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),120),
            left(COALESCE(NEW.raw_user_meta_data->>'department','Information Technology'),80),
            left(COALESCE(NEW.raw_user_meta_data->>'year','Second Year'),30),
            left(COALESCE(NEW.raw_user_meta_data->>'division','B'),10),
            NEW.email, NEW.id, false);
  END IF;
  RETURN NEW;
END $$;