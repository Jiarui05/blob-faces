import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { BlobFace } from '../src/react/index.js';

describe('<BlobFace />', () => {
  it('renders the same svg as the core renderer', () => {
    const html = renderToStaticMarkup(<BlobFace spec={{ mood: 'smug', eyes: 'sideEye', shape: 3 }} size={48} title="smug" />);
    expect(html).toContain('<svg');
    expect(html).toContain('width="48"');
    expect(html).toContain('<title>smug</title>');
  });
});
