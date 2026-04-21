"use client";

import { useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, AlertCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { buildSchema } from "@/lib/schema";
import { DynamicIcon } from "@/components/ui/DynamicIcon";
import { Button } from "@/components/ui/Button";
import type { AzureResource, SelectedResource } from "@/types";

interface ResourceDrawerProps {
  resource: AzureResource | null;
  isDuplicate: boolean;
  onClose: () => void;
  onAdd: (resource: SelectedResource) => void;
}

export function ResourceDrawer({
  resource,
  isDuplicate,
  onClose,
  onAdd,
}: ResourceDrawerProps) {
  const drawerRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const isOpen = resource !== null;

  const FOCUSABLE =
    'input:not([disabled]), select:not([disabled]), button:not([disabled]), [tabindex]:not([tabindex="-1"])';

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key === "Tab") {
        const elements = Array.from(
          drawerRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? [],
        );
        if (elements.length === 0) return;
        const first = elements[0];
        const last = elements[elements.length - 1];
        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    },
    [onClose],
  );

  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement as HTMLElement;
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
      requestAnimationFrame(() => {
        const firstInput = drawerRef.current?.querySelector<HTMLElement>(
          "input, select, button",
        );
        firstInput?.focus();
      });
    } else {
      previousFocusRef.current?.focus();
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, handleKeyDown]);

  return (
    <AnimatePresence>
      {isOpen && resource && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/50"
            onClick={onClose}
            aria-hidden="true"
          />
          <motion.aside
            ref={drawerRef}
            role="dialog"
            aria-modal="true"
            aria-label={`Configure ${resource.name}`}
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col border-l border-border bg-surface-elevated shadow-2xl"
          >
            <DrawerContent
              resource={resource}
              isDuplicate={isDuplicate}
              onClose={onClose}
              onAdd={onAdd}
            />
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

function DrawerContent({
  resource,
  isDuplicate,
  onClose,
  onAdd,
}: ResourceDrawerProps & { resource: AzureResource }) {
  const schema = buildSchema(resource.fields);
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm({ resolver: zodResolver(schema) });

  function onSubmit(values: Record<string, unknown>) {
    onAdd({
      type: resource.type,
      name: resource.name,
      icon: resource.icon,
      config: values,
    });
  }

  return (
    <>
      <div className="flex items-center justify-between border-b border-border px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/10">
            <DynamicIcon name={resource.icon} className="h-5 w-5 text-accent" />
          </div>
          <div>
            <h2 className="font-semibold text-text">{resource.name}</h2>
            <p className="text-xs text-text-muted">{resource.description}</p>
          </div>
        </div>
        <button
          onClick={onClose}
          aria-label="Close panel"
          className="rounded-lg p-1.5 text-text-muted hover:bg-surface hover:text-text"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-5">
        {isDuplicate ? (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <AlertCircle className="h-10 w-10 text-warning" />
            <h3 className="font-semibold text-text">Already Added</h3>
            <p className="text-sm text-text-muted">
              You&apos;ve already added a <strong>{resource.name}</strong> to
              your setup. Each resource type can only be added once.
            </p>
            <Button variant="ghost" size="sm" onClick={onClose}>
              Close
            </Button>
          </div>
        ) : (
          <form id="resource-form" onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
            {resource.fields.map((field) => {
              const fieldId = `drawer-${field.name}`;
              const helpId = `${fieldId}-help`;
              const errorId = `${fieldId}-error`;
              const describedBy = errors[field.name]
                ? errorId
                : field.helpText
                  ? helpId
                  : undefined;

              return (
                <div key={field.name} className="space-y-1.5">
                  {field.type !== "toggle" && (
                    <label
                      htmlFor={fieldId}
                      className="block text-sm font-medium text-text"
                    >
                      {field.label}
                      {field.required && (
                        <>
                          <span aria-hidden="true" className="ml-1 text-error">*</span>
                          <span className="sr-only"> (required)</span>
                        </>
                      )}
                    </label>
                  )}

                  {field.type === "text" && (
                    <input
                      id={fieldId}
                      type="text"
                      placeholder={field.placeholder}
                      aria-invalid={!!errors[field.name]}
                      aria-required={field.required}
                      aria-describedby={describedBy}
                      {...register(field.name)}
                      className={`w-full rounded-lg border bg-surface px-4 py-2.5 text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent ${
                        errors[field.name] ? "border-error" : "border-border"
                      }`}
                    />
                  )}

                  {field.type === "number" && (
                    <input
                      id={fieldId}
                      type="number"
                      placeholder={field.placeholder}
                      min={field.min}
                      max={field.max}
                      aria-invalid={!!errors[field.name]}
                      aria-required={field.required}
                      aria-describedby={describedBy}
                      {...register(field.name)}
                      className={`w-full rounded-lg border bg-surface px-4 py-2.5 text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent ${
                        errors[field.name] ? "border-error" : "border-border"
                      }`}
                    />
                  )}

                  {field.type === "select" && (
                    <select
                      id={fieldId}
                      aria-invalid={!!errors[field.name]}
                      aria-required={field.required}
                      aria-describedby={describedBy}
                      {...register(field.name)}
                      className={`w-full rounded-lg border bg-surface px-4 py-2.5 text-sm text-text focus:outline-none focus:ring-2 focus:ring-accent ${
                        errors[field.name] ? "border-error" : "border-border"
                      }`}
                    >
                      <option value="">Select an option...</option>
                      {field.options?.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  )}

                  {field.type === "toggle" && (
                    <label className="flex cursor-pointer items-start gap-3">
                      <div className="relative mt-0.5 shrink-0">
                        <input
                          id={fieldId}
                          type="checkbox"
                          aria-describedby={field.helpText ? helpId : undefined}
                          {...register(field.name)}
                          className="peer sr-only"
                          onChange={(e) => setValue(field.name, e.target.checked, { shouldDirty: true, shouldTouch: true })}
                          checked={watch(field.name) as boolean | undefined ?? false}
                        />
                        <div className="h-6 w-11 rounded-full border border-border bg-surface transition-colors peer-checked:border-accent peer-checked:bg-accent peer-focus-visible:ring-2 peer-focus-visible:ring-accent peer-focus-visible:ring-offset-1 peer-focus-visible:ring-offset-surface-elevated" />
                        <div className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-text-muted transition-transform peer-checked:translate-x-5 peer-checked:bg-white" />
                      </div>
                      <div>
                        <span className="text-sm font-medium text-text">{field.label}</span>
                        {field.helpText && (
                          <p id={helpId} className="mt-0.5 text-xs text-text-muted">{field.helpText}</p>
                        )}
                      </div>
                    </label>
                  )}

                  {field.type !== "toggle" && field.helpText && (
                    <p id={helpId} className="text-xs text-text-muted">{field.helpText}</p>
                  )}

                  {errors[field.name] && (
                    <p id={errorId} role="alert" className="text-xs text-error">
                      {String(errors[field.name]?.message)}
                    </p>
                  )}
                </div>
              );
            })}
          </form>
        )}
      </div>

      {!isDuplicate && (
        <div className="border-t border-border px-6 py-4">
          <Button type="submit" form="resource-form" className="w-full">
            Add to Setup
          </Button>
        </div>
      )}
    </>
  );
}
