import { expect, test } from '@playwright/test';
import { addToOrder, openOrder, orderButton, serviceById, servicesInSiteOrder } from './helpers';

const toxina = serviceById('toxina-botulinica');
const masaje = serviceById('masaje-relajante');

test.describe('Mi pedido', () => {
  test('arma un pedido y genera el mensaje de WhatsApp', async ({ page }) => {
    // The test relies on these modalities; fail loudly if the data changes.
    expect(toxina.modalities).toEqual(['estudio']);
    expect(masaje.modalities).toContain('domicilio');

    await page.goto('catalogo/');
    await addToOrder(page, toxina.name);
    await addToOrder(page, masaje.name);
    await expect(orderButton(page)).toContainText('2');

    const dialog = await openOrder(page);
    await expect(dialog.getByRole('listitem')).toHaveCount(2);
    await expect(dialog.getByText('Solo en el estudio')).toBeVisible();

    // The neighborhood field only appears once something is "a domicilio".
    const neighborhood = dialog.getByRole('textbox', { name: /Barrio o localidad/ });
    await expect(neighborhood).toBeHidden();
    await dialog.getByRole('radio', { name: 'A domicilio' }).check();
    await expect(neighborhood).toBeVisible();

    await dialog.getByRole('button', { name: `Una persona más para ${masaje.name}` }).click();
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
    expect(text).toContain(`1. ${toxina.name} — En el estudio`);
    expect(text).toContain(`2. ${masaje.name} — A domicilio · 2 personas`);
    expect(text).toContain('Nombre: Ana');
    expect(text).toContain('Barrio o localidad: Modelia');
    expect(text).toContain('Fecha preferida: sábado');
  });

  test('el pedido se conserva al recargar, sin datos personales', async ({ page }) => {
    const limpieza = serviceById('limpieza-facial');
    await page.goto(`servicios/${limpieza.id}/`);
    await addToOrder(page, limpieza.name);
    let dialog = await openOrder(page);
    await dialog.getByRole('textbox', { name: 'Nombre' }).fill('Ana');
    await dialog.getByRole('button', { name: 'Cerrar pedido' }).click();
    await expect(dialog).toBeHidden();

    await page.reload();
    await expect(orderButton(page)).toContainText('1');
    const stored = await page.evaluate(() => localStorage.getItem('pololas:pedido:v1'));
    expect(JSON.parse(stored ?? 'null')).toEqual([
      { id: limpieza.id, modality: limpieza.modalities[0], people: 1 },
    ]);
    expect(stored).not.toContain('Ana');

    dialog = await openOrder(page);
    await expect(dialog.getByRole('listitem')).toHaveCount(1);
    await expect(dialog.getByRole('link', { name: limpieza.name })).toBeVisible();
    await expect(dialog.getByRole('textbox', { name: 'Nombre' })).toHaveValue('');
  });

  test('quita tratamientos y vacía el pedido', async ({ page }) => {
    const bio = serviceById('bioestimuladores');
    const hilos = serviceById('hilos-tensores');
    await page.goto('catalogo/');
    await addToOrder(page, bio.name);
    await addToOrder(page, hilos.name);

    const dialog = await openOrder(page);
    await dialog.getByRole('button', { name: `Quitar ${hilos.name} del pedido` }).click();
    await expect(dialog.getByRole('listitem')).toHaveCount(1);

    await dialog.getByRole('button', { name: 'Vaciar pedido' }).click();
    await expect(dialog.getByText('Tu pedido está vacío')).toBeVisible();
    await expect(dialog.getByRole('link', { name: 'Enviar pedido por WhatsApp' })).toBeHidden();
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(
      page.getByRole('button', { name: `Agregar al pedido: ${hilos.name}`, exact: true }).first(),
    ).toBeVisible();
  });

  test('un tratamiento ya agregado abre el pedido en lugar de duplicarse', async ({ page }) => {
    await page.goto(`servicios/${toxina.id}/`);
    await addToOrder(page, toxina.name);
    await page
      .getByRole('button', { name: `En tu pedido: ${toxina.name}. Ver pedido`, exact: true })
      .filter({ visible: true })
      .first()
      .click();
    const dialog = page.getByRole('dialog', { name: 'Mi pedido' });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('listitem')).toHaveCount(1);
  });

  test('el pedido vacío sugiere los tratamientos destacados y sus enlaces funcionan', async ({
    page,
  }) => {
    const featured = servicesInSiteOrder.filter((service) => service.featured);
    expect(featured.length).toBeGreaterThan(0);

    await page.goto('./');
    const dialog = await openOrder(page);
    await expect(dialog.getByText('Tu pedido está vacío')).toBeVisible();
    await expect(
      dialog.getByRole('heading', { level: 3, name: 'Te puede interesar', exact: true }),
    ).toBeVisible();

    const suggestions = dialog.getByRole('listitem').getByRole('link');
    await expect(suggestions).toHaveText(featured.map((service) => service.name));
    for (const [index, service] of featured.entries()) {
      await expect(suggestions.nth(index)).toHaveAttribute(
        'href',
        new RegExp(`/PololasBeautyStudio/servicios/${service.id}/$`),
      );
    }

    const target = featured.at(-1)!;
    await suggestions.nth(featured.length - 1).click();
    await expect(page).toHaveURL(new RegExp(`servicios/${target.id}/$`));
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(target.name);
    await expect(page.getByRole('dialog', { name: 'Mi pedido' })).toBeHidden();
  });
});
