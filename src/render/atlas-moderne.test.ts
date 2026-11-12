// L'atlas du DLC s'ajoute à l'atlas principal sans en écraser un sprite (partie pure de `AtlasRendu.ajouterAtlas`).
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { fusionnerSprites, type AtlasJson } from './atlas';

const principal = JSON.parse(readFileSync('public/sprites/atlas.json', 'utf-8')) as AtlasJson;
const moderne = JSON.parse(readFileSync('public/sprites/atlas-moderne.json', 'utf-8')) as AtlasJson;

describe('fusion des sprites de l’atlas du DLC', () => {
  it('garde tous les sprites des deux atlas, ceux du DLC tels quels', () => {
    const fusion = fusionnerSprites(principal.sprites, moderne.sprites);
    expect(Object.keys(fusion)).toHaveLength(Object.keys(principal.sprites).length + Object.keys(moderne.sprites).length);
    expect(fusion['moderne-megaphone-chat']).toBe(moderne.sprites['moderne-megaphone-chat']);
    expect(fusion['tour-tir-1']).toBe(principal.sprites['tour-tir-1']);
  });

  it('refuse un nom présent dans les deux', () => {
    expect(() => fusionnerSprites(principal.sprites, { 'tour-tir-1': moderne.sprites['moderne-tir-1'] as never })).toThrow('double');
  });
});
