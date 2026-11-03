import { Order } from '../types';

/**
 * Format currency number in Algerian Dinars (e.g. 3 500 DA)
 */
function formatDA(amount: number): string {
  const rounded = Math.round(amount);
  return `${rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} DA`;
}

/**
 * Format timestamp to HH:mm (Africa/Algiers)
 */
function formatOrderTime(isoString?: string): string {
  try {
    const d = isoString ? new Date(isoString) : new Date();
    if (isNaN(d.getTime())) return new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    return d.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Africa/Algiers',
    });
  } catch {
    return new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  }
}

/**
 * Build clean, professional WhatsApp dispatch message for drivers and kitchen.
 * Formatted in plain text with mobile-friendly emojis as specified in product rules.
 */
export function buildWhatsAppMessage(order: Order): string {
  const isDelivery = order.type === 'delivery';
  const orderTime = formatOrderTime(order.createdAt);
  const separator = '━━━━━━━━━━';

  const lines: string[] = [];

  // 1. Header with type and order number
  if (isDelivery) {
    lines.push(`🛵 *LIVRAISON* — ${order.orderNumber}`);
    lines.push(`👤 ${order.customerName}`);
    lines.push(`📞 ${order.customerPhone}`);

    // Delivery address
    const addrParts: string[] = [];
    if (order.deliveryAddress?.address) addrParts.push(order.deliveryAddress.address);
    if (order.deliveryAddress?.landmark) addrParts.push(`(Réf: ${order.deliveryAddress.landmark})`);
    if (order.deliveryAddress?.commune && order.deliveryAddress.commune !== 'Birkhadem') {
      addrParts.push(order.deliveryAddress.commune);
    } else if (order.deliveryAddress?.commune) {
      addrParts.push(order.deliveryAddress.commune);
    }
    const fullAddress = addrParts.join(', ') || 'Birkhadem';
    lines.push(`📍 ${fullAddress}`);

    if (order.deliveryAddress?.mapUrl) {
      lines.push(`🗺️ GPS : ${order.deliveryAddress.mapUrl}`);
    }
  } else {
    lines.push(`🏪 *COMPTOIR* — ${order.orderNumber}`);
    lines.push(`👤 ${order.customerName} — 📞 ${order.customerPhone}`);

    const slot = order.pickupTimeSlot || 'Dès que possible';
    lines.push(`⏰ Retrait : ${slot}`);
  }

  // 2. Ordered articles
  lines.push(separator);
  if (order.items && order.items.length > 0) {
    order.items.forEach(item => {
      lines.push(`${item.quantity}x ${item.nameFr}`);
      if (item.notes) {
        lines.push(`   └ Note : ${item.notes}`);
      }
    });
  } else {
    lines.push('1x Commande');
  }
  lines.push(separator);

  // 3. Kitchen note (only if not empty)
  if (order.kitchenNotes && order.kitchenNotes.trim()) {
    lines.push(`📝 ${order.kitchenNotes.trim()}`);
  }

  // 4. Financial summary
  if (isDelivery) {
    lines.push(`💰 Articles : ${formatDA(order.subtotal)}`);
    lines.push(`🚚 Livraison : ${formatDA(order.deliveryFee)}`);
    lines.push(`✅ *TOTAL : ${formatDA(order.total)}* (paiement à la livraison)`);
  } else {
    lines.push(`✅ *TOTAL : ${formatDA(order.total)}* (paiement au comptoir)`);
  }

  // 5. Order time & Driver call-to-action
  lines.push(`🕐 Heure : ${orderTime}`);

  if (isDelivery) {
    lines.push(separator);
    lines.push(`📢 *APPEL LIVREUR :* Commande acceptée ! Merci au livreur disponible sur le groupe de répondre pour passer la récupérer au restaurant (Birkhadem).`);
  }

  return lines.join('\n');
}

/**
 * Generate universal WhatsApp wa.me link with encoded message.
 */
export function getWhatsAppShareUrl(message: string): string {
  return `https://wa.me/?text=${encodeURIComponent(message)}`;
}

/**
 * Trigger sending via WhatsApp universal link.
 * Opens WhatsApp Web on desktop or the WhatsApp app on mobile.
 */
export function sendToWhatsApp(
  order: Order,
  customMessage?: string
): { success: boolean; url: string; fallbackText: string } {
  const message = customMessage !== undefined ? customMessage : buildWhatsAppMessage(order);
  const url = getWhatsAppShareUrl(message);

  let opened = false;
  try {
    const win = window.open(url, '_blank', 'noopener,noreferrer');
    if (win && !win.closed) {
      opened = true;
    }
  } catch {
    opened = false;
  }

  return {
    success: opened,
    url,
    fallbackText: message,
  };
}

/**
 * Copy WhatsApp formatted message to clipboard as a fallback.
 */
export async function copyWhatsAppMessage(
  order: Order,
  customMessage?: string
): Promise<boolean> {
  const message = customMessage !== undefined ? customMessage : buildWhatsAppMessage(order);
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(message);
      return true;
    }
    // Fallback using textarea
    const textarea = document.createElement('textarea');
    textarea.value = message;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    const success = document.execCommand('copy');
    document.body.removeChild(textarea);
    return success;
  } catch {
    return false;
  }
}
