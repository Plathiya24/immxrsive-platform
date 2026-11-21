window.bindIndustryRequests = async function bindIndustryRequests(projectId, api) {
  const root = document.querySelector('#industry-requests');
  const route = '/api/work/' + encodeURIComponent(projectId) + '/industry';
  const escape = value => String(value ?? '').replace(/[&<>"']/g, char =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  try {
    const [requests, partners] = await Promise.all([api(route), api('/api/partners')]);
    root.innerHTML = '<h2>ImmXrsive review</h2><p>Staff review requests before issuing official verification or publishing an industry relationship.</p>' +
      '<p role="status" aria-live="polite" data-result></p><ul>' + requests.map(request =>
        '<li>' + escape(request.type === 'verification' ? 'Project verification' :
          (partners.find(partner => partner.id === request.company_id)?.name || request.suggested_company || 'Industry partner')) +
        ' · ' + escape(request.status) + (request.reviewer_note ? ' · ' + escape(request.reviewer_note) : '') + '</li>').join('') + '</ul>' +
      '<form data-type="verification"><h3>Request project verification</h3><label>Supporting note or evidence<textarea name="note" maxlength="3000" required></textarea></label><button>Request verification</button></form>' +
      '<form data-type="partner"><h3>Add industry partner</h3><label>Choose a company<select name="company_id"><option value="">Suggest a new company</option>' +
      partners.map(partner => '<option value="' + escape(partner.id) + '">' + escape(partner.name) + '</option>').join('') +
      '</select></label><label>New company name<input name="suggested_company" maxlength="200"></label>' +
      '<label>Explain the relationship<textarea name="note" maxlength="3000" required></textarea></label><button>Send partner request</button></form>';
    for (const form of root.querySelectorAll('form')) form.addEventListener('submit', async event => {
      event.preventDefault();
      const button = event.submitter;
      button.disabled = true;
      try {
        await api(route, 'POST', { ...Object.fromEntries(new FormData(form)), type: form.dataset.type });
        await bindIndustryRequests(projectId, api);
        root.querySelector('[data-result]').textContent = 'Request sent for staff review. Status: pending.';
      } catch (error) {
        root.querySelector('[data-result]').textContent = error.message;
      } finally { button.disabled = false; }
    });
  } catch (error) {
    root.textContent = 'ImmXrsive review is unavailable: ' + error.message;
  }
};
