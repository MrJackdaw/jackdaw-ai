export default function StripePricingTable() {
  return (
    // @ts-expect-error - stripe web-component comes from stripe
    <stripe-pricing-table
      pricing-table-id="prctbl_1PPTjd01xKS21I8rdHFbBE43"
      publishable-key={import.meta.env.VITE_STRIPE_PK}
    />
  );
}
