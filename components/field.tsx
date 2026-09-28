"use client";

import { useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export function TextField({ label, id, ...rest }: TextFieldProps) {
  // useId(), not a slug derived from the label text - two different forms on
  // the same page (e.g. "Edit details" and "Add contact") both have a field
  // labeled "Name", and a label-derived id collided across them, silently
  // routing input into the wrong field via the first same-id match.
  const generatedId = useId();
  const inputId = id ?? generatedId;
  return (
    <div>
      <label htmlFor={inputId} className="label">
        {label}
      </label>
      <input id={inputId} className="input" {...rest} />
    </div>
  );
}

interface TextAreaFieldProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
}

export function TextAreaField({ label, id, ...rest }: TextAreaFieldProps) {
  const generatedId = useId();
  const areaId = id ?? generatedId;
  return (
    <div>
      <label htmlFor={areaId} className="label">
        {label}
      </label>
      <textarea id={areaId} className="input" {...rest} />
    </div>
  );
}

interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  children: ReactNode;
}

export function SelectField({ label, id, children, ...rest }: SelectFieldProps) {
  const generatedId = useId();
  const selectId = id ?? generatedId;
  return (
    <div>
      <label htmlFor={selectId} className="label">
        {label}
      </label>
      <select id={selectId} className="input" {...rest}>
        {children}
      </select>
    </div>
  );
}
