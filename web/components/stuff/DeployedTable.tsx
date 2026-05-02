"use client";

import { motion } from "framer-motion";

const DEPLOYED_ITEMS = [
  {
    id: "marketing-site",
    name: "marketing-site",
    location: "Virginia, USA",
    timeAgo: "3 days ago",
    type: "Website",
    project: "Marketing team",
    ticket: "DEP-1048",
    status: "running",
  },
  {
    id: "customer-feedback-db",
    name: "customer-feedback-db",
    location: "Dublin, Ireland",
    timeAgo: "2 weeks ago",
    type: "Database",
    project: "My sandbox",
    ticket: "DEP-0992",
    status: "running",
  },
  {
    id: "launch-assets",
    name: "launch-assets-storage",
    location: "Virginia, USA",
    timeAgo: "1 week ago",
    type: "File storage",
    project: "Q3 product launch",
    ticket: "DEP-1024",
    status: "running",
  },
  {
    id: "event-signup",
    name: "event-signup-form",
    location: "Amsterdam, NL",
    timeAgo: "1 month ago",
    type: "Simple website",
    project: "Marketing team",
    ticket: "DEP-0876",
    status: "running",
  },
];

export function DeployedTable() {
  return (
    <div className="mt-6 overflow-x-auto rounded-xl border border-border bg-surface">
      <table className="w-full text-left text-sm text-text-muted" aria-label="Your deployed resources">
        <caption className="sr-only">Your deployed resources</caption>
        <thead className="border-b border-border bg-bg">
          <tr>
            <th scope="col" className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-text-muted">
              Name
            </th>
            <th scope="col" className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-text-muted">
              What it is
            </th>
            <th scope="col" className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-text-muted">
              Project
            </th>
            <th scope="col" className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-text-muted">
              Ticket
            </th>
            <th
              scope="col"
              className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-text-muted"
            >
              Status
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {DEPLOYED_ITEMS.map((item, index) => (
            <motion.tr
              key={item.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(index * 0.05, 0.3) }}
              className="group transition-colors hover:bg-surface-elevated"
            >
              <td className="px-6 py-4">
                <div className="flex items-center gap-4">
                  <div className="h-2 w-2 shrink-0 rounded-full bg-success" />
                  <div className="flex flex-col">
                    <span className="font-sans font-bold text-text group-hover:text-accent">
                      {item.name}
                    </span>
                    <span className="text-xs text-text-muted opacity-75">
                      {item.location} · {item.timeAgo}
                    </span>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 text-text">{item.type}</td>
              <td className="px-6 py-4 text-text">{item.project}</td>
              <td className="px-6 py-4 font-mono text-xs">{item.ticket}</td>
              <td className="px-6 py-4 text-right">
                <span className="inline-flex items-center justify-center rounded border border-success/20 bg-success/10 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-success">
                  {item.status}
                </span>
              </td>
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
