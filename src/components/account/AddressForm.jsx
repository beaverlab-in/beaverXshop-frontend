"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import Field from "@/components/ui/Field";
import { INDIAN_STATES } from "@/lib/india";
import { validateAddress } from "@/lib/validation";
import { saveAddress } from "@/lib/client/accountApi";

const empty = { fullName: "", mobile: "", pincode: "", state: "", city: "", house: "", street: "", landmark: "", type: "home", isDefault: false };

/** Add / edit address. Validates locally for fast feedback; the backend validates again. */
export default function AddressForm({ initial, defaultName = "", defaultMobile = "", onSaved, onCancel, submitLabel = "Save address" }) {
  const [values, setValues] = useState({ ...empty, fullName: defaultName, mobile: defaultMobile, ...initial });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState("");

  const set = (name) => (e) => {
    const value = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setValues((v) => ({ ...v, [name]: value }));
    setErrors((er) => ({ ...er, [name]: undefined }));
  };

  async function onSubmit(e) {
    e.preventDefault();
    const { errors: found } = validateAddress(values);
    setErrors(found);
    if (Object.keys(found).length) return;
    setBusy(true);
    setFormError("");
    try {
      const result = await saveAddress(values);
      onSaved?.(result);
    } catch (err) {
      if (err.fields) setErrors(err.fields);
      setFormError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Full name" autoComplete="name" value={values.fullName} onChange={set("fullName")} error={errors.fullName} />
        <Field label="Mobile number" type="tel" inputMode="tel" autoComplete="tel-national" value={values.mobile} onChange={set("mobile")} error={errors.mobile} />
        <Field label="PIN code" inputMode="numeric" autoComplete="postal-code" maxLength={6} value={values.pincode} onChange={set("pincode")} error={errors.pincode} />
        <Field label="State" as="select" autoComplete="address-level1" value={values.state} onChange={set("state")} error={errors.state}>
          <option value="">Select state</option>
          {INDIAN_STATES.map((s) => (
            <option key={s.code} value={s.name}>
              {s.name}
            </option>
          ))}
        </Field>
        <Field label="City / Town" autoComplete="address-level2" value={values.city} onChange={set("city")} error={errors.city} />
        <Field label="House / Flat / Building" autoComplete="address-line1" value={values.house} onChange={set("house")} error={errors.house} />
      </div>
      <Field label="Street / Area" autoComplete="address-line2" value={values.street} onChange={set("street")} error={errors.street} />
      <Field label="Landmark" optional value={values.landmark} onChange={set("landmark")} />

      <fieldset>
        <legend className="mb-1.5 text-sm font-medium">Address type</legend>
        <div className="flex flex-wrap gap-2">
          {[["home", "Home"], ["work", "Work"], ["other", "Other"]].map(([value, label]) => (
            <label
              key={value}
              className={`inline-flex min-h-11 cursor-pointer items-center rounded-full border px-5 text-sm font-semibold transition-colors has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-focus ${
                values.type === value ? "border-brand bg-brand text-white" : "border-line bg-surface hover:border-brand/50"
              }`}
            >
              <input type="radio" name="type" value={value} checked={values.type === value} onChange={set("type")} className="sr-only" />
              {label}
            </label>
          ))}
        </div>
      </fieldset>

      <label className="flex min-h-11 cursor-pointer items-center gap-3">
        <input type="checkbox" checked={values.isDefault} onChange={set("isDefault")} className="size-5 accent-[var(--color-brand)]" />
        <span className="text-[0.95rem]">Make this my default address</span>
      </label>

      {formError && (
        <p role="alert" className="text-sm font-medium text-danger">
          {formError}
        </p>
      )}
      <div className="flex flex-wrap gap-3 pt-2">
        <Button type="submit" loading={busy}>
          {submitLabel}
        </Button>
        {onCancel && (
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}
