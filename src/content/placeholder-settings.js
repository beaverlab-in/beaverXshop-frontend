// SAMPLE store settings used only while NEXT_PUBLIC_DATA_SOURCE=placeholder.
// In production every value here is managed from the admin panel (storeSettings collection).
// Company identity fields are intentionally empty: they are never invented.

export const placeholderSettings = {
  company: {
    tradeName: "", // filled by admin; falls back to the brand name
    legalName: "",
    gstin: "",
    address: "",
    supportEmail: "",
    supportPhone: "",
    supportHours: "",
    social: { instagram: "", youtube: "", linkedin: "", x: "", facebook: "" },
  },
  commerce: {
    pricesIncludeGst: true, // admin-manageable
    shipping: { flatPaise: 6000, freeAbovePaise: 99900 }, // admin-manageable SAMPLE values
    cod: { enabled: true, feePaise: 0, maxOrderPaise: 0 }, // admin-manageable; 0 = no limit
  },
  storefront: { announcement: null }, // admin-managed in API mode (Settings > Storefront); off in the demo
  coupons: { demoCode: "DEMO10" }, // demo only
};
