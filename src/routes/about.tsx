import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — Student Reimbursement System" },
      { name: "description", content: "Academic details and architecture of the Student Reimbursement and Advance Settlement System mini project." },
      { property: "og:title", content: "About — Student Reimbursement System" },
      { property: "og:description", content: "OOP in Java mini project: academic details and architecture." },
    ],
  }),
  component: About,
});

const details: [string, string][] = [
  ["Student", "Pratik Deepak Phapale"],
  ["PRN", "125B1F210"],
  ["College", "Pimpri Chinchwad College of Engineering, Pune"],
  ["Department", "Information Technology"],
  ["Year / Semester", "Second Year · Semester III"],
  ["Division", "B"],
  ["Faculty", "Tanuja Patankar"],
  ["Subject", "Object-Oriented Programming in Java — mini project"],
];

function About() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-14">
      <Link to="/" className="text-sm text-primary hover:underline">← Home</Link>
      <h1 className="mt-6 text-4xl">About this project</h1>
      <p className="mt-4 text-muted-foreground">
        An academic mini project. It is not an official college system and is not endorsed or deployed by the college.
        All bank details are fictional demo values.
      </p>
      <dl className="mt-10 divide-y rounded-lg border bg-card">
        {details.map(([k, v]) => (
          <div key={k} className="grid grid-cols-3 gap-4 px-5 py-3 text-sm">
            <dt className="text-muted-foreground">{k}</dt>
            <dd className="col-span-2">{v}</dd>
          </div>
        ))}
      </dl>
      <h2 className="mt-12 text-2xl">How it works</h2>
      <pre className="tabular mt-4 overflow-x-auto rounded-lg bg-navy p-5 text-xs leading-relaxed text-navy-foreground">
{`Browser
  └─▶ Web server function (checks login + role, loads records)
        └─▶ Java Spring Boot service (validation, workflow, money rules)
        ◀── decision
  └─▶ Web server saves the result atomically (version check)`}
      </pre>
    </div>
  );
}
