import { describe, expect, it } from 'vitest';
import { joinBase } from './paths';

describe('joinBase', () => {
  it('prefixes internal paths with the base, with or without slashes', () => {
    expect(joinBase('/PololasBeautyStudio/', '/catalogo/')).toBe('/PololasBeautyStudio/catalogo/');
    expect(joinBase('/PololasBeautyStudio', 'catalogo/')).toBe('/PololasBeautyStudio/catalogo/');
    expect(joinBase('/PololasBeautyStudio/', '/')).toBe('/PololasBeautyStudio/');
    expect(joinBase('/', '/servicios/botox/')).toBe('/servicios/botox/');
  });

  it('keeps query strings and hashes', () => {
    expect(joinBase('/base/', '/catalogo/?cat=spa')).toBe('/base/catalogo/?cat=spa');
    expect(joinBase('/base/', '/#contacto')).toBe('/base/#contacto');
  });

  it('leaves absolute URLs and in-page anchors untouched', () => {
    expect(joinBase('/base/', 'https://wa.me/573202078089')).toBe('https://wa.me/573202078089');
    expect(joinBase('/base/', 'mailto:pololasbs@gmail.com')).toBe('mailto:pololasbs@gmail.com');
    expect(joinBase('/base/', '#contenido')).toBe('#contenido');
  });
});
