import { describe, expect, it } from 'vitest';
import { parseBackup } from '../backup';

const fileOf = (obj: unknown, name = 'b.json'): File => new File([typeof obj === 'string' ? obj : JSON.stringify(obj)], name, { type: 'application/json' });

const trial = {
  id: 't1', profileId: 'p1', sessionId: 's1', trackId: 'colors', stageId: 'C1', itemId: 'red', step: 'match', helpLevel: 0,
  optionsCount: 4, variantId: 'circle', distractorIds: ['blue'], chosenId: 'red', correct: true, isReview: false, isPlacement: false, timestamp: 1,
};
const profile = { id: 'p1', name: 'Teste', nickname: 'Teste', avatar: 'sun', createdAt: 1 };

describe('Importação de backup (seções 15 e 20)', () => {
  it('aceita um backup válido', async () => {
    const b = await parseBackup(fileOf({ app: 'app-aprender', version: 1, exportedAt: 5, profiles: [profile], trials: [trial], offscreen: [], settings: {} }));
    expect(b.profiles).toHaveLength(1);
    expect(b.trials).toHaveLength(1);
  });

  it('recusa JSON inválido, outro app e registros malformados', async () => {
    await expect(parseBackup(fileOf('{isso não é json'))).rejects.toThrow(/JSON/);
    await expect(parseBackup(fileOf({ app: 'outro', version: 1 }))).rejects.toThrow(/deste app/);
    await expect(parseBackup(fileOf({ app: 'app-aprender', version: 1, profiles: [{ id: 1 }], trials: [], offscreen: [] }))).rejects.toThrow(/perfil/);
    await expect(parseBackup(fileOf({ app: 'app-aprender', version: 1, profiles: [], trials: [{ ...trial, step: 'hack' }], offscreen: [] }))).rejects.toThrow(/tentativa/);
  });

  it('recusa arquivo acima de 20 MB', async () => {
    const big = new File([new Uint8Array(21 * 1024 * 1024)], 'big.json');
    await expect(parseBackup(big)).rejects.toThrow(/20 MB/);
  });

  it('nunca executa nada do arquivo: campos extras são ignorados', async () => {
    const b = await parseBackup(fileOf({ app: 'app-aprender', version: 1, profiles: [], trials: [], offscreen: [], settings: { devMode: true, clockOffsetMs: 999, __proto__: { x: 1 } }, script: 'alert(1)' }));
    expect(b.settings).not.toHaveProperty('script');
  });
});
