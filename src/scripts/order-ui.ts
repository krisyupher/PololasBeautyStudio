import { catalog, orderStore } from './order-store';
import { LIMITS, MODALITY_LABELS, type Modality } from '../lib/constants';
import type { Order, OrderItem } from '../lib/cart';
import { isModality } from '../lib/search';
import { serviceUrl } from '../lib/paths';
import {
  buildOrderMessage,
  buildWhatsAppUrl,
  generateOrderCode,
  needsNeighborhood,
  type OrderDetails,
} from '../lib/whatsapp';

// All dynamic text is written with textContent / attributes, never as HTML.

const announcer = document.querySelector<HTMLElement>('[data-announcer]');
const toast = document.querySelector<HTMLElement>('[data-toast]');
const toastText = toast?.querySelector<HTMLElement>('[data-toast-text]');

const dialog = document.querySelector<HTMLDialogElement>('[data-order-dialog]');
const dialogTitle = dialog?.querySelector<HTMLElement>('[data-order-title]');
const list = dialog?.querySelector<HTMLOListElement>('[data-order-list]');
const emptyState = dialog?.querySelector<HTMLElement>('[data-order-empty]');
const form = dialog?.querySelector<HTMLFormElement>('[data-order-form]');
const footer = dialog?.querySelector<HTMLElement>('[data-order-footer]');
const neighborhoodField = dialog?.querySelector<HTMLElement>('[data-neighborhood-field]');
const sendLink = dialog?.querySelector<HTMLAnchorElement>('[data-send-order]');
const itemTemplate = document.querySelector<HTMLTemplateElement>('#order-item-template');

let orderCode = generateOrderCode();
let toastTimer: number | undefined;

function announce(message: string): void {
  if (!announcer) return;
  announcer.textContent = '';
  // Set on the next frame so a repeated message is announced again.
  requestAnimationFrame(() => {
    announcer.textContent = message;
  });
}

function showToast(message: string): void {
  if (!toast || !toastText) return;
  toastText.textContent = message;
  toast.hidden = false;
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => {
    toast.hidden = true;
  }, 4000);
}

function peopleLabel(people: number): string {
  return people === 1 ? '1 persona' : `${people} personas`;
}

/* ---------- Counters and "Agregar al pedido" buttons ---------- */

function renderCounters(order: Order): void {
  document.querySelectorAll<HTMLElement>('[data-order-count]').forEach((badge) => {
    badge.textContent = String(order.length);
    badge.hidden = order.length === 0;
  });
}

function renderAddButtons(): void {
  document.querySelectorAll<HTMLButtonElement>('[data-add-to-order]').forEach((button) => {
    const inOrder = orderStore.has(button.dataset.addToOrder ?? '');
    const name = button.dataset.name ?? '';
    const addLabel = button.querySelector<HTMLElement>('[data-label-add]');
    const addedLabel = button.querySelector<HTMLElement>('[data-label-added]');
    if (addLabel) addLabel.hidden = inOrder;
    if (addedLabel) addedLabel.hidden = !inOrder;
    // The accessible name starts with the visible text (WCAG 2.5.3) and names the treatment.
    button.setAttribute(
      'aria-label',
      inOrder ? `En tu pedido: ${name}. Ver pedido` : `Agregar al pedido: ${name}`,
    );
    button.classList.toggle('btn--primary', !inOrder);
    button.classList.toggle('btn--outline', inOrder);
  });
}

/* ---------- Dialog ---------- */

function openDialog(): void {
  if (!dialog || dialog.open) return;
  toast?.setAttribute('hidden', '');
  dialog.showModal();
}

function readDetails(): OrderDetails {
  if (!form) return {};
  const data = new FormData(form);
  const value = (key: string) => String(data.get(key) ?? '');
  return {
    name: value('name'),
    neighborhood: value('neighborhood'),
    date: value('date'),
    comments: value('comments'),
  };
}

function updateSendLink(): void {
  if (!sendLink) return;
  const order = orderStore.get();
  if (order.length === 0) {
    sendLink.removeAttribute('href');
    sendLink.setAttribute('aria-disabled', 'true');
    return;
  }
  sendLink.href = buildWhatsAppUrl(buildOrderMessage(order, readDetails(), orderCode));
  sendLink.removeAttribute('aria-disabled');
}

function buildModalityControl(item: OrderItem, fieldset: HTMLFieldSetElement): void {
  const offered: readonly Modality[] = catalog.get(item.id)?.modalities ?? [item.modality];
  if (offered.length === 1) {
    const single = document.createElement('span');
    single.className = 'segmented__single';
    single.textContent = `Solo ${MODALITY_LABELS[item.modality].toLowerCase()}`;
    fieldset.append(single);
    return;
  }
  for (const modality of offered) {
    const label = document.createElement('label');
    const input = document.createElement('input');
    input.type = 'radio';
    input.name = `modalidad-${item.id}`;
    input.value = modality;
    input.checked = item.modality === modality;
    input.dataset.focusKey = `modality-${modality}`;
    const text = document.createElement('span');
    text.textContent = MODALITY_LABELS[modality];
    label.append(input, text);
    fieldset.append(label);
  }
}

function renderItem(item: OrderItem): HTMLLIElement | null {
  const li = itemTemplate?.content.firstElementChild?.cloneNode(true);
  if (!(li instanceof HTMLLIElement)) return null;
  li.dataset.itemId = item.id;

  const link = li.querySelector<HTMLAnchorElement>('[data-item-link]');
  if (link) {
    link.textContent = item.name;
    link.href = serviceUrl(item.id);
  }
  li.querySelector('[data-item-remove]')?.setAttribute(
    'aria-label',
    `Quitar ${item.name} del pedido`,
  );

  const fieldset = li.querySelector<HTMLFieldSetElement>('[data-item-modalities]');
  if (fieldset) buildModalityControl(item, fieldset);

  li.querySelector('[data-item-people]')?.setAttribute('aria-label', `Personas para ${item.name}`);
  const value = li.querySelector<HTMLElement>('[data-people-value]');
  if (value) value.textContent = peopleLabel(item.people);
  const dec = li.querySelector<HTMLButtonElement>('[data-people-dec]');
  const inc = li.querySelector<HTMLButtonElement>('[data-people-inc]');
  dec?.setAttribute('aria-label', `Una persona menos para ${item.name}`);
  inc?.setAttribute('aria-label', `Una persona más para ${item.name}`);
  // aria-disabled (not disabled) so keyboard focus is not lost at the limits.
  dec?.setAttribute('aria-disabled', String(item.people <= 1));
  inc?.setAttribute('aria-disabled', String(item.people >= LIMITS.maxPeople));
  return li;
}

function renderList(order: Order): void {
  if (!list) return;
  // Re-rendering replaces the controls; remember which one had focus and restore it.
  const active = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  const focusKey = active?.dataset.focusKey;
  const focusItem = active?.closest<HTMLElement>('[data-item-id]')?.dataset.itemId;

  list.replaceChildren(...order.map(renderItem).filter((li): li is HTMLLIElement => li !== null));

  if (focusKey && focusItem) {
    list
      .querySelector<HTMLElement>(
        `[data-item-id="${CSS.escape(focusItem)}"] [data-focus-key="${CSS.escape(focusKey)}"]`,
      )
      ?.focus();
  }

  const isEmpty = order.length === 0;
  if (emptyState) emptyState.hidden = !isEmpty;
  list.hidden = isEmpty;
  if (form) form.hidden = isEmpty;
  if (footer) footer.hidden = isEmpty;
  if (neighborhoodField) neighborhoodField.hidden = !needsNeighborhood(order);
  updateSendLink();
}

function render(order: Order): void {
  renderCounters(order);
  renderAddButtons();
  renderList(order);
}

/* ---------- Events ---------- */

document.addEventListener('click', (event) => {
  const target = event.target instanceof Element ? event.target : null;
  if (!target) return;

  const addButton = target.closest<HTMLButtonElement>('[data-add-to-order]');
  if (addButton) {
    const id = addButton.dataset.addToOrder ?? '';
    if (orderStore.has(id)) {
      openDialog();
    } else {
      orderStore.add(id);
      const name = catalog.get(id)?.name ?? 'El tratamiento';
      const total = orderStore.get().length;
      showToast(`${name} se agregó a tu pedido`);
      announce(`${name} se agregó a tu pedido. Tienes ${total} en total.`);
    }
    return;
  }

  if (target.closest('[data-open-order]')) {
    openDialog();
    return;
  }

  if (target.closest('[data-close-order]')) dialog?.close();
});

// Clicking the backdrop (the dialog element itself, outside the panel) closes it.
dialog?.addEventListener('click', (event) => {
  if (event.target === dialog) dialog.close();
});

list?.addEventListener('click', (event) => {
  const target = event.target instanceof Element ? event.target : null;
  const id = target?.closest<HTMLElement>('[data-item-id]')?.dataset.itemId;
  if (!target || !id) return;
  const item = orderStore.get().find((entry) => entry.id === id);
  if (!item) return;

  if (target.closest('[data-item-remove]')) {
    orderStore.remove(id);
    announce(`${item.name} se quitó de tu pedido`);
    dialogTitle?.focus();
  } else if (target.closest('[data-people-dec]') && item.people > 1) {
    orderStore.update(id, { people: item.people - 1 });
    announce(peopleLabel(item.people - 1));
  } else if (target.closest('[data-people-inc]') && item.people < LIMITS.maxPeople) {
    orderStore.update(id, { people: item.people + 1 });
    announce(peopleLabel(item.people + 1));
  }
});

list?.addEventListener('change', (event) => {
  const input = event.target instanceof HTMLInputElement ? event.target : null;
  const id = input?.closest<HTMLElement>('[data-item-id]')?.dataset.itemId;
  if (input?.type === 'radio' && id && isModality(input.value)) {
    orderStore.update(id, { modality: input.value });
  }
});

form?.addEventListener('input', updateSendLink);
// The form is never submitted (and CSP form-action is 'none'); Enter does nothing.
form?.addEventListener('submit', (event) => event.preventDefault());

sendLink?.addEventListener('click', () => {
  announce('Abriendo WhatsApp con tu pedido');
});

dialog?.querySelector('[data-clear-order]')?.addEventListener('click', () => {
  orderStore.clear();
  form?.reset();
  orderCode = generateOrderCode();
  announce('Vaciaste tu pedido');
  dialogTitle?.focus();
});

// Close the mobile menu after choosing a link (in-page anchors don't reload the page).
document.querySelectorAll<HTMLDetailsElement>('[data-mobile-menu]').forEach((menu) => {
  menu.addEventListener('click', (event) => {
    if (event.target instanceof Element && event.target.closest('a')) menu.open = false;
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && menu.open) {
      menu.open = false;
      menu.querySelector('summary')?.focus();
    }
  });
});

/* ---------- Start ---------- */

orderStore.subscribe(render);
render(orderStore.get());
document.querySelectorAll('[data-needs-js]').forEach((el) => el.removeAttribute('data-needs-js'));
