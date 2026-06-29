import { createSection } from './section';
import { renderIconPickerRow } from './icon-picker';

function findTextNode(el: Element): Text | null {
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      return (node.textContent ?? '').trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP;
    },
  });
  return walker.nextNode() as Text | null;
}

function getText(el: Element): string {
  return findTextNode(el)?.textContent?.trim() ?? '';
}

function setText(el: Element, text: string): void {
  const node = findTextNode(el);
  if (node) node.textContent = text;
}

// Form elements have no meaningful text-node child (inputs are void; their
// visible "watermark" lives in the `placeholder` attribute). When CX-Visual's
// text-label section is invoked on an <input> or <textarea>, switch the
// row to edit the placeholder attribute instead — that's the equivalent
// of editing the visible label for the kind of element a designer cares about.
function isFormInput(el: Element): el is HTMLInputElement | HTMLTextAreaElement {
  const tag = el.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA';
}

export function createTextLabelSection(el: Element, onChange: () => void): HTMLDivElement {
  const { root, body } = createSection({ title: 'Content', defaultOpen: true });

  const row = document.createElement('div');
  row.className = 'two-col';

  const lbl = document.createElement('div');
  lbl.className = 'control-label';

  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'text-input';
  input.spellcheck = false;

  if (isFormInput(el)) {
    lbl.textContent = 'Placeholder';
    input.value = el.getAttribute('placeholder') ?? '';
    input.placeholder = 'Placeholder text…';
    input.addEventListener('input', () => {
      el.setAttribute('placeholder', input.value);
      onChange();
    });
  } else {
    lbl.textContent = 'Label';
    input.value = getText(el);
    input.placeholder = 'Label text…';
    input.addEventListener('input', () => {
      setText(el, input.value);
      onChange();
    });
  }

  row.append(lbl, input);
  body.appendChild(row);

  if (el.querySelector('cxui-icon')) {
    renderIconPickerRow(el, body, onChange);
  }

  return root;
}
