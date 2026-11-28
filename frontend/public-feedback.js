function showSlowLoad(status, message) {
  const timer = setTimeout(() => { status.textContent = message; }, 1000);
  return () => clearTimeout(timer);
}

function showPageRecovery(container, { title, text, href, label, retry }) {
  container.innerHTML = '<section class="panel page-recovery"><h1></h1><p role="status"></p><div class="recovery-actions"></div></section>';
  container.querySelector('h1').textContent = title;
  container.querySelector('[role="status"]').textContent = text;
  const actions = container.querySelector('.recovery-actions');
  if (retry) {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = 'Retry';
    button.addEventListener('click', retry, { once: true });
    actions.append(button);
  }
  const link = document.createElement('a');
  link.className = 'secondary-link';
  link.href = href;
  link.textContent = label;
  actions.append(link);
}

function watchPreview(preview, message, href, label) {
  const image = preview.querySelector('img');
  function showFallback() {
    image.hidden = true;
    const fallback = document.createElement('div');
    fallback.className = 'preview-fallback';
    const text = document.createElement('p');
    text.textContent = message;
    const link = document.createElement('a');
    link.href = href;
    link.textContent = label;
    fallback.append(text, link);
    image.after(fallback);
  }
  if (image.complete && !image.naturalWidth) showFallback();
  else image.addEventListener('error', showFallback, { once: true });
}

function showLoadingStatus(container, label) {
  const status = document.createElement('p');
  status.className = 'notice page-loading';
  status.setAttribute('role', 'status');
  status.textContent = label;
  container.replaceChildren(status);
  return showSlowLoad(status, 'Still loading. The service may be waking up.');
}
