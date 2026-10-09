import { expect, test } from '@playwright/test';
import {
  categories,
  categoryById,
  collectErrors,
  openOrder,
  serviceById,
  services,
  servicesInSiteOrder,
  twoToneName,
} from './helpers';

test.describe('páginas', () => {
  test('inicio: hero, secciones y todos los tratamientos', async ({ page }) => {
    const errors = collectErrors(page);
    await page.goto('./');
    await expect(page).toHaveTitle('Pololas Beauty Studio');
    await expect(page.getByRole('heading', { level: 1 })).toHaveAccessibleName(
      'Tu bienestar en buenas manos',
    );
    await expect(page.getByRole('link', { name: 'Ver catálogo' }).first()).toBeVisible();

    for (const category of categories) {
      await expect(
        page
          .locator(`section#${category.id}`)
          .getByRole('heading', { level: 2, name: twoToneName(category), exact: true }),
      ).toBeVisible();
    }
    for (const [id, name] of [
      ['como-pedir', 'Cómo pedir'],
      ['modalidades', 'En el estudio o en tu casa'],
      ['preguntas', 'Preguntas frecuentes'],
      ['contacto', 'Gracias Por ser parte de esta historia'],
    ]) {
      await expect(
        page.locator(`section#${id}`).getByRole('heading', { level: 2, name, exact: true }),
      ).toBeVisible();
    }
    await expect(page.getByRole('heading', { name: 'Tratamientos destacados' })).toHaveCount(0);

    // Every treatment is on the home page, in its category section, with its own add button.
    const addButtons = page.locator('main [data-add-to-order]');
    await expect(addButtons).toHaveCount(services.length);
    for (const service of servicesInSiteOrder) {
      const section = page.locator(`section#${service.category}`);
      await expect(
        section.getByRole('heading', { level: 3, name: service.name, exact: true }),
      ).toBeVisible();
      await expect(
        section.getByRole('button', { name: `Agregar al pedido: ${service.name}`, exact: true }),
      ).toBeVisible();
    }
    expect(errors).toEqual([]);
  });

  test('inicio: el panel de contacto enlaza a WhatsApp, Instagram y Maps', async ({ page }) => {
    await page.goto('./');
    const contact = page.locator('#contacto');

    const whatsapp = contact.getByRole('link', {
      name: 'Agenda tu cita +57 320 207 8089 (WhatsApp)',
      exact: true,
    });
    const whatsappUrl = new URL((await whatsapp.getAttribute('href')) ?? '');
    expect(whatsappUrl.host).toBe('wa.me');
    expect(whatsappUrl.pathname).toBe('/573202078089');
    expect(whatsappUrl.searchParams.get('text')).toBeTruthy();

    const instagram = contact.getByRole('link', {
      name: 'Síguenos Pololas Beauty Studio (Instagram)',
      exact: true,
    });
    await expect(instagram).toHaveAttribute(
      'href',
      'https://www.instagram.com/pololasbeautystudio/',
    );

    const maps = contact.getByRole('link', {
      name: 'Visítanos Modelia, Bogotá (Google Maps)',
      exact: true,
    });
    const mapsUrl = new URL((await maps.getAttribute('href')) ?? '');
    expect(mapsUrl.host).toBe('www.google.com');
    expect(mapsUrl.pathname).toBe('/maps/search/');
    expect(mapsUrl.searchParams.get('query')).toContain('Modelia');

    const facebook = contact.getByRole('link', { name: 'Facebook', exact: true });
    await expect(facebook).toHaveAttribute('href', /^https:\/\/www\.facebook\.com\//);

    for (const external of [whatsapp, instagram, maps, facebook]) {
      await expect(external).toBeVisible();
      await expect(external).toHaveAttribute('target', '_blank');
      await expect(external).toHaveAttribute('rel', 'noopener noreferrer');
    }
    await expect(contact.getByRole('link', { name: 'pololasbs@gmail.com' })).toHaveAttribute(
      'href',
      'mailto:pololasbs@gmail.com',
    );
  });

  test('los círculos destacados llevan a cada tratamiento', async ({ page }) => {
    for (const [label, id] of [
      ['Toxina', 'toxina-botulinica'],
      ['Labios', 'acido-hialuronico'],
      ['Rino', 'acido-hialuronico'],
      ['Bioestimuladores', 'bioestimuladores'],
    ] as const) {
      await page.goto('./');
      await page
        .getByRole('region', { name: 'Explora por tratamiento' })
        .getByRole('link', { name: label, exact: true })
        .click();
      await expect(page).toHaveURL(new RegExp(`/PololasBeautyStudio/servicios/${id}/$`));
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(serviceById(id).name);
    }
  });

  test('los círculos de categoría saltan a su sección', async ({ page }) => {
    await page.goto('./');
    const highlights = page.getByRole('region', { name: 'Explora por tratamiento' });
    for (const category of categories) {
      await expect(
        highlights.getByRole('link', { name: category.shortName, exact: true }),
      ).toHaveAttribute('href', `#${category.id}`);
    }

    const last = categories.at(-1)!;
    await highlights.getByRole('link', { name: last.shortName, exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`#${last.id}$`));
    await expect(
      page.locator(`section#${last.id}`).getByRole('heading', { level: 2 }),
    ).toBeInViewport();
  });

  test('detalle de tratamiento con datos estructurados', async ({ page }) => {
    const errors = collectErrors(page);
    const toxina = serviceById('toxina-botulinica');
    const category = categoryById(toxina.category);
    await page.goto(`servicios/${toxina.id}/`);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(toxina.name);
    await expect(page.getByRole('heading', { name: 'Antes de tu procedimiento' })).toBeVisible();

    // Related: the other treatments of the same category.
    const related = services.filter(
      (service) => service.category === toxina.category && service.id !== toxina.id,
    );
    const relatedSection = page.getByRole('region', { name: 'También te puede interesar' });
    await expect(
      relatedSection.getByRole('heading', { level: 2, name: 'También te puede interesar' }),
    ).toBeVisible();
    await expect(relatedSection.getByRole('heading', { level: 3 })).toHaveText(
      related.map((service) => service.name),
    );

    // The category's value badges.
    const values = page.getByRole('region', {
      name: `Lo que nos distingue en ${category.name.toLowerCase()}`,
    });
    await expect(values.getByRole('listitem')).toHaveText(
      category.values.map((value) => value.label),
      { ignoreCase: true },
    );

    const jsonLd = await page
      .locator('script[type="application/ld+json"]')
      .evaluateAll((nodes) => nodes.map((node) => JSON.parse(node.textContent ?? '{}')));
    expect(jsonLd.map((data) => data['@type'])).toEqual(['Service', 'BreadcrumbList']);
    expect(jsonLd[0].name).toBe(toxina.name);
    expect(jsonLd[0].url).toBe(
      'https://krisyupher.github.io/PololasBeautyStudio/servicios/toxina-botulinica/',
    );

    const ask = page.getByRole('link', { name: 'Preguntar por WhatsApp' });
    const text = new URL((await ask.getAttribute('href')) ?? '').searchParams.get('text');
    expect(text).toContain(toxina.name);
    expect(errors).toEqual([]);
  });

  test('sin aviso de valoración en tratamientos que no la requieren', async ({ page }) => {
    const masaje = serviceById('masaje-relajante');
    expect(masaje.requiresAssessment).toBe(false);
    await page.goto(`servicios/${masaje.id}/`);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(masaje.name);
    await expect(page.getByRole('heading', { name: 'Antes de tu procedimiento' })).toHaveCount(0);
  });

  test('"botox" solo es una etiqueta de búsqueda oculta', async ({ page }) => {
    const toxina = serviceById('toxina-botulinica');
    expect(toxina.tags).toContain('botox');

    await page.goto('catalogo/');
    await page.getByRole('searchbox', { name: 'Buscar tratamiento' }).fill('botox');
    const cards = page.locator('[data-service-card]:visible');
    await expect(cards).toHaveCount(1);
    await expect(cards.getByRole('heading', { name: toxina.name, exact: true })).toBeVisible();

    for (const path of ['./', 'catalogo/', `servicios/${toxina.id}/`]) {
      await page.goto(path);
      // innerText covers rendered text, including visually hidden screen-reader text.
      const text = await page.locator('body').innerText();
      expect(text, path).not.toMatch(/botox/i);
      expect(await page.title(), path).not.toMatch(/botox/i);
    }
  });

  test('no hay errores de consola ni de CSP al usar el pedido', async ({ page }) => {
    const errors = collectErrors(page);
    await page.goto('catalogo/');
    await page.getByRole('searchbox', { name: 'Buscar tratamiento' }).fill('masaje');
    await page
      .getByRole('button', { name: 'Agregar al pedido: Masaje relajante', exact: true })
      .first()
      .click();
    await openOrder(page);
    expect(errors).toEqual([]);
  });

  test('página 404 propia', async ({ page }) => {
    const response = await page.goto('esta-pagina-no-existe/');
    expect(response?.status()).toBe(404);
    await expect(page.getByRole('heading', { level: 1 })).toHaveAccessibleName(
      'Esta página se fue a relajar',
    );
  });

  test('menú móvil', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'Solo en teléfonos');
    await page.goto('./');
    const menu = page.getByRole('navigation', { name: 'Menú principal' });
    await expect(menu).toBeHidden();
    await page.locator('summary[aria-label="Menú"]').click();
    await menu.getByRole('link', { name: 'Catálogo' }).click();
    await expect(page).toHaveURL(/catalogo\/$/);
  });
});
