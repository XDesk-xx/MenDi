export const counterLabel = '次数：';

export interface CounterArgs {
  disabled?: boolean;
}

export function Counter({ disabled = false }: CounterArgs) {
  const section = document.createElement('section');
  const heading = document.createElement('h1');
  const output = document.createElement('output');
  const button = document.createElement('button');
  let count = 0;
  heading.textContent = 'MVP-D03-A 受控组件';
  output.setAttribute('role', 'status');
  output.textContent = counterLabel + count;
  button.textContent = '增加';
  button.disabled = disabled;
  button.addEventListener('click', () => {
    count += 1;
    output.textContent = counterLabel + count;
  });
  section.style.cssText =
    'font:18px system-ui;padding:32px;max-width:480px;background:#edf4ff;color:#18324f;border-radius:12px';
  output.style.cssText = 'display:block;margin:24px 0';
  button.style.cssText = 'font:inherit;padding:10px 24px';
  section.append(heading, output, button);
  return section;
}
