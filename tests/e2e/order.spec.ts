import { expect, test } from '@playwright/test';
import { addToOrder, openOrder, orderButton } from './helpers';

test.describe('Mi pedido', () => {
  test('arma un pedido y genera el mensaje de WhatsApp', async ({ page }) => {
    await page.goto('catalogo/');
    await addToOrder(page, 'Botox (toxina botulínica)');
    await addToOrder(page, 'Masaje relajante');
    await expect(orderButton(page)).toContainText('2');

    const dialog = await openOrder(page);
    await expect(dialog.getByRole('listitem')).toHaveCount(2);
    await expect(dialog.getByText('Solo en el estudio')).toBeVisible();

    // The neighborhood field only appears once something is "a domicilio".
    const neighborhood = dialog.getByRole('textbox', { name: /Barrio o localidad/ });
    await expect(neighborhood).toBeHidden();
    await dialog.getByRole('radio', { name: 'A domicilio' }).check();
    await expect(neighborhood).toBeVisible();

    await dialog.getByRole('button', { name: 'Una persona más para Masaje relajante' }).click();
    await expect(dialog.getByText('2 personas')).toBeVisible();
    await dialog.getByRole('textbox', { name: 'Nombre' }).fill('Ana');
    await neighborhood.fill('Modelia');
    await dialog.getByRole('textbox', { name: 'Fecha y franja preferida' }).fill('sábado');

    const send = dialog.getByRole('link', { name: 'Enviar pedido por WhatsApp' });
    await expect(send).toHaveAttribute('target', '_blank');
    const url = new URL((await send.getAttribute('href')) ?? '');
    expect(url.host).toBe('wa.me');
    expect(url.pathname).toBe('/573202078089');
    const text = url.searchParams.get('text') ?? '';
    expect(text).toMatch(/pedido #[A-HJ-NP-Z2-9]{4}/);
    expect(text).toContain('1. Botox (toxina botulínica) — En el estudio');
    expect(text).toContain('2. Masaje relajante — A domicilio · 2 personas');
    expect(text).toContain('Nombre: Ana');
    expect(text).toContain('Barrio o localidad: Modelia');
    expect(text).toContain('Fecha preferida: sábado');
  });

  test('el pedido se conserva al recargar, sin datos personales', async ({ page }) => {
    await page.goto('servicios/bambuterapia/');
    await addToOrder(page, 'Bambuterapia');
    let dialog = await openOrder(page);
    await dialog.getByRole('textbox', { name: 'Nombre' }).fill('Ana');
    await dialog.getByRole('button', { name: 'Cerrar pedido' }).click();
    await expect(dialog).toBeHidden();

    await page.reload();
    await expect(orderButton(page)).toContainText('1');
    const stored = await page.evaluate(() => localStorage.getItem('pololas:pedido:v1'));
    expect(JSON.parse(stored ?? 'null')).toEqual([
      { id: 'bambuterapia', modality: 'estudio', people: 1 },
    ]);
    expect(stored).not.toContain('Ana');

    dialog = await openOrder(page);
    await expect(dialog.getByRole('listitem')).toHaveCount(1);
    await expect(dialog.getByRole('textbox', { name: 'Nombre' })).toHaveValue('');
  });

  test('quita tratamientos y vacía el pedido', async ({ page }) => {
    await page.goto('catalogo/');
    await addToOrder(page, 'Porcelanización facial');
    await addToOrder(page, 'Hydra Lips');

    const dialog = await openOrder(page);
    await dialog.getByRole('button', { name: 'Quitar Hydra Lips del pedido' }).click();
    await expect(dialog.getByRole('listitem')).toHaveCount(1);

    await dialog.getByRole('button', { name: 'Vaciar pedido' }).click();
    await expect(dialog.getByText('Tu pedido está vacío')).toBeVisible();
    await expect(dialog.getByRole('link', { name: 'Enviar pedido por WhatsApp' })).toBeHidden();
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(
      page.getByRole('button', { name: 'Agregar al pedido: Hydra Lips' }).first(),
    ).toBeVisible();
  });

  test('un tratamiento ya agregado abre el pedido en lugar de duplicarse', async ({ page }) => {
    await page.goto('servicios/botox/');
    await addToOrder(page, 'Botox (toxina botulínica)');
    await page
      .getByRole('button', { name: /En tu pedido: Botox/ })
      .filter({ visible: true })
      .first()
      .click();
    const dialog = page.getByRole('dialog', { name: 'Mi pedido' });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('listitem')).toHaveCount(1);
  });
});
