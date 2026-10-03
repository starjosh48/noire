import { commerce, deliveryEstimate, siteConfig } from "@/lib/config";
import { firstName, formatDate, formatPrice, productLabel } from "@/lib/format";
import type { OrderDetail } from "@/lib/orders/queries";
import { orderUrl } from "@/lib/orders/status";
import { paymentMethodLabel } from "@/lib/payments";

const escape = (value: string) =>
  value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

// Email-safe tokens: inline hex values only (email clients ignore CSS variables).
const C = {
  page: "#F5F4F2",
  card: "#FFFFFF",
  ink: "#111111",
  body: "#3D3D3D",
  muted: "#7A7A7A",
  line: "#ECEAE6",
  soft: "#F7F6F4",
};
const SANS = "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Helvetica, Arial, sans-serif";
const SERIF = "Didot, 'Bodoni 72', Georgia, 'Times New Roman', serif";

/** Email clients block SVG, so product shots are sent as JPG renders (scripts/generate-email-images.mjs). */
function emailImage(imageUrl: string) {
  const match = imageUrl.match(/^\/images\/products\/([a-z0-9-]+)\/front\.svg$/);
  return match ? `${siteConfig.url}/images/products/${match[1]}/email.jpg` : null;
}

const label = (text: string) =>
  `<div style="font-family:${SANS};font-size:12px;line-height:16px;color:${C.muted};">${text}</div>`;

export function orderConfirmationEmail(order: OrderDetail) {
  const viewUrl = `${siteConfig.url}${orderUrl(order)}`;
  const price = (n: number) => formatPrice(n, order.currency);
  const name = firstName(order.customer_name);
  const paid = order.payment_status === "paid";
  const eta = deliveryEstimate(order.state);
  const heroImage = order.items[0] ? emailImage(order.items[0].image_url) : null;

  const address = [
    order.customer_name,
    order.shipping_address,
    [order.city, order.state].filter(Boolean).join(", "),
    [order.country, order.postal_code].filter(Boolean).join(" "),
  ]
    .filter(Boolean)
    .map(escape)
    .join("<br>");

  const items = order.items
    .map((item, i) => {
      const img = emailImage(item.image_url);
      const url = `${siteConfig.url}/shop/${item.product_slug}`;
      const divider = i === 0 ? "" : `border-top:1px solid ${C.line};`;
      return `
        <tr>
          <td width="72" valign="top" style="padding:20px 0;${divider}">
            <a href="${url}" style="text-decoration:none;">${
              img
                ? `<img src="${img}" width="72" height="90" alt="${escape(item.product_name)}" style="display:block;width:72px;height:90px;border:0;border-radius:4px;background:${C.soft};">`
                : `<div style="width:72px;height:90px;border-radius:4px;background:${C.soft};"></div>`
            }</a>
          </td>
          <td valign="top" style="padding:22px 16px 20px;${divider}">
            <a href="${url}" style="font-family:${SANS};font-size:15px;line-height:20px;font-weight:600;color:${C.ink};text-decoration:none;">${escape(item.product_name)}</a>
            <div style="padding-top:4px;font-family:${SANS};font-size:13px;line-height:18px;color:${C.muted};">${productLabel(item.product_number)} · ${item.size_ml} ml</div>
            <div style="padding-top:2px;font-family:${SANS};font-size:13px;line-height:18px;color:${C.muted};">Qty ${item.quantity}</div>
          </td>
          <td valign="top" align="right" style="padding:22px 0 20px;${divider}font-family:${SANS};font-size:15px;line-height:20px;color:${C.ink};white-space:nowrap;">${price(item.total_price)}</td>
        </tr>`;
    })
    .join("");

  const summaryRow = (left: string, right: string, strong = false) => `
    <tr>
      <td style="padding:${strong ? "14px 0 0" : "4px 0"};font-family:${SANS};font-size:${strong ? 16 : 14}px;line-height:22px;color:${strong ? C.ink : C.body};${strong ? "font-weight:600;" : ""}">${left}</td>
      <td align="right" style="padding:${strong ? "14px 0 0" : "4px 0"};font-family:${SANS};font-size:${strong ? 16 : 14}px;line-height:22px;color:${C.ink};${strong ? "font-weight:600;" : ""}">${right}</td>
    </tr>`;

  const fact = (title: string, value: string, width: string) => `
    <td width="${width}" valign="top" class="fact" style="padding:16px 18px;">
      ${label(title)}
      <div style="padding-top:4px;font-family:${SANS};font-size:14px;line-height:20px;font-weight:600;color:${C.ink};">${value}</div>
    </td>`;

  const html = `<!doctype html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="x-apple-disable-message-reformatting">
<meta name="color-scheme" content="light only">
<meta name="supported-color-schemes" content="light only">
<title>Your NOIRÉ order ${order.order_number}</title>
<style>
  @media (max-width: 600px) {
    .card { padding: 32px 24px !important; }
    .h1 { font-size: 30px !important; line-height: 36px !important; }
    .fact { display: block !important; width: auto !important; border-left: 0 !important; }
    .fact + .fact { border-top: 1px solid ${C.line} !important; }
    .col { display: block !important; width: 100% !important; padding: 24px 0 0 !important; }
    .col + .col { padding-top: 24px !important; }
  }
  a[x-apple-data-detectors] { color: inherit !important; text-decoration: none !important; }
</style>
</head>
<body style="margin:0;padding:0;background:${C.page};-webkit-font-smoothing:antialiased;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">We&rsquo;ve received your order and we&rsquo;re getting it ready. Expected delivery: ${eta}.&#8199;&#65279;&#847;&#8199;&#65279;&#847;&#8199;&#65279;&#847;</div>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${C.page}" style="background:${C.page};">
<tr><td align="center" style="padding:40px 12px;">
<!--[if mso]><table role="presentation" width="560" align="center" cellpadding="0" cellspacing="0" border="0"><tr><td><![endif]-->
<table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:560px;">

  <!-- Brand -->
  <tr><td align="center" style="padding:0 0 28px;">
    <a href="${siteConfig.url}" style="font-family:${SERIF};font-size:20px;letter-spacing:7px;color:${C.ink};text-decoration:none;padding-left:7px;">NOIRÉ</a>
  </td></tr>

  <!-- Card -->
  <tr><td class="card" bgcolor="${C.card}" style="background:${C.card};border-radius:12px;padding:44px 48px;">

    <!-- Hero: centred, anchored on the first fragrance ordered -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr><td align="center">
        ${
          heroImage
            ? `<a href="${viewUrl}" style="text-decoration:none;"><img src="${heroImage}" width="120" height="150" alt="" style="display:block;width:120px;height:150px;border:0;border-radius:6px;background:${C.soft};"></a>`
            : ""
        }
        <div style="padding-top:${heroImage ? 28 : 0}px;font-family:${SANS};font-size:11px;line-height:16px;letter-spacing:2.4px;text-transform:uppercase;color:${C.muted};">&#10003;&nbsp;&nbsp;Order confirmed</div>
        <h1 class="h1" style="margin:14px 0 0;font-family:${SERIF};font-size:38px;line-height:44px;font-weight:normal;letter-spacing:-0.3px;color:${C.ink};">Thank you${name ? `, ${escape(name)}` : ""}.</h1>
        <p style="margin:14px auto 0;max-width:400px;font-family:${SANS};font-size:15px;line-height:24px;color:${C.body};">
          Your order is confirmed and we&rsquo;re preparing it with care. We&rsquo;ll email you again as soon as it&rsquo;s on its way.
        </p>
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:30px auto 0;">
          <tr><td bgcolor="${C.ink}" style="background:${C.ink};border-radius:3px;">
            <a href="${viewUrl}" style="display:inline-block;padding:16px 34px;font-family:${SANS};font-size:12px;line-height:16px;font-weight:600;letter-spacing:1.8px;text-transform:uppercase;color:#FFFFFF;text-decoration:none;border-radius:3px;">View your order</a>
          </td></tr>
        </table>
      </td></tr>
    </table>

    <!-- Key facts -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:36px 0 0;border:1px solid ${C.line};border-radius:8px;border-collapse:separate;">
      <tr>
        ${fact("Order number", order.order_number, "38%")}
        ${fact("Order date", formatDate(order.created_at, { month: "short" }), "28%").replace('class="fact" style="', `class="fact" style="border-left:1px solid ${C.line};`)}
        ${fact("Estimated delivery", eta, "34%").replace('class="fact" style="', `class="fact" style="border-left:1px solid ${C.line};`)}
      </tr>
    </table>

    <!-- Items -->
    <div style="margin:36px 0 0;font-family:${SANS};font-size:16px;line-height:22px;font-weight:600;color:${C.ink};">Order summary</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:4px;">${items}</table>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:4px;border-top:1px solid ${C.line};padding-top:16px;">
      <tr><td style="padding-top:16px;"></td><td></td></tr>
      ${summaryRow("Subtotal", price(order.subtotal))}
      ${summaryRow("Delivery", order.shipping_fee > 0 ? price(order.shipping_fee) : "Free")}
      ${summaryRow("Total", price(order.total), true)}
    </table>

    <!-- Delivery & payment -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:36px;border-top:1px solid ${C.line};">
      <tr>
        <td width="50%" valign="top" class="col" style="padding:28px 16px 0 0;">
          <div style="font-family:${SANS};font-size:14px;line-height:20px;font-weight:600;color:${C.ink};">Shipping to</div>
          <div style="padding-top:8px;font-family:${SANS};font-size:14px;line-height:22px;color:${C.body};">${address}</div>
        </td>
        <td width="50%" valign="top" class="col" style="padding:28px 0 0;">
          <div style="font-family:${SANS};font-size:14px;line-height:20px;font-weight:600;color:${C.ink};">Payment</div>
          <div style="padding-top:8px;font-family:${SANS};font-size:14px;line-height:22px;color:${C.body};">
            ${escape(paymentMethodLabel(order.payment_method))}<br>
            <span style="color:${C.muted};">${paid ? `Paid ${price(order.total)}` : "Nothing charged yet. Pay when it arrives."}</span>
          </div>
        </td>
      </tr>
    </table>

  </td></tr>

  <!-- Help -->
  <tr><td align="center" style="padding:28px 24px 0;font-family:${SANS};font-size:13px;line-height:20px;color:${C.muted};">
    Questions? Reply to this email or contact
    <a href="mailto:${siteConfig.supportEmail}" style="color:${C.ink};text-decoration:underline;">${siteConfig.supportEmail}</a>
  </td></tr>

  <!-- Footer -->
  <tr><td align="center" style="padding:20px 24px 0;font-family:${SANS};font-size:12px;line-height:18px;color:${C.muted};">
    <a href="${siteConfig.url}/shop" style="color:${C.muted};text-decoration:none;">Shop</a>&nbsp;&nbsp;·&nbsp;&nbsp;<a href="${siteConfig.url}/care#delivery" style="color:${C.muted};text-decoration:none;">Delivery</a>&nbsp;&nbsp;·&nbsp;&nbsp;<a href="${siteConfig.url}/care#returns" style="color:${C.muted};text-decoration:none;">Returns</a><br>
    <span style="display:inline-block;padding-top:10px;">NOIRÉ · Lagos, Nigeria · Unopened fragrances can be returned within ${commerce.returnWindowDays} days.</span>
  </td></tr>

</table>
<!--[if mso]></td></tr></table><![endif]-->
</td></tr>
</table>
</body>
</html>`;

  const text = [
    `NOIRÉ`,
    ``,
    `Thanks for your order${name ? `, ${name}` : ""}.`,
    `We've received your order and we're getting it ready. We'll email you again as soon as it's on its way.`,
    ``,
    `Order number: ${order.order_number}`,
    `Order date: ${formatDate(order.created_at)}`,
    `Estimated delivery: ${eta}`,
    ``,
    ...order.items.map((i) => `${i.product_name} (${productLabel(i.product_number)}, ${i.size_ml} ml) × ${i.quantity}: ${price(i.total_price)}`),
    ``,
    `Subtotal: ${price(order.subtotal)}`,
    `Delivery: ${order.shipping_fee > 0 ? price(order.shipping_fee) : "Free"}`,
    `Total: ${price(order.total)}`,
    ``,
    `Shipping to:`,
    ...[order.customer_name, order.shipping_address, [order.city, order.state].filter(Boolean).join(", "), order.country].filter(Boolean),
    ``,
    `Payment: ${paymentMethodLabel(order.payment_method)}${paid ? " (paid)" : " (pay when it arrives)"}`,
    ``,
    `View order: ${viewUrl}`,
    `Questions? ${siteConfig.supportEmail}`,
  ].join("\n");

  return {
    subject: `Order confirmed: ${order.order_number}`,
    html,
    text,
  };
}
