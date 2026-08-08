(function () {
  const KEY = 'monthlyTrackerSettings';
  const DEFAULTS = { currency: 'MYR', reminderDays: 7, defaultCategory: 'Needs', showHealth: true, showReminders: true, largeText: false, reducedMotion: false };
  function get() {
    try { return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY) || '{}') }; }
    catch { return { ...DEFAULTS }; }
  }
  function save(next) { localStorage.setItem(KEY, JSON.stringify(next)); apply(next); return next; }
  function apply(settings) {
    document.documentElement.classList.toggle('large-text', settings.largeText);
    document.documentElement.classList.toggle('reduce-motion', settings.reducedMotion);
    if (!document.body) return;
    document.body.classList.toggle('hide-health', !settings.showHealth);
    document.body.classList.toggle('hide-reminders', !settings.showReminders);
  }
  function money(value) {
    const settings = get();
    const formats = {
      MYR: ['en-MY', 'MYR'], USD: ['en-US', 'USD'], EUR: ['de-DE', 'EUR'], GBP: ['en-GB', 'GBP']
    };
    const [locale, currency] = formats[settings.currency] || formats.MYR;
    return new Intl.NumberFormat(locale, { style: 'currency', currency, minimumFractionDigits: 2 }).format(Number(value) || 0);
  }
  window.AppSettings = { get, save, apply, money };
  apply(get());
  document.addEventListener('DOMContentLoaded', () => {
    apply(get());
    const form = document.querySelector('[data-settings-form]');
    if (!form) return;
    const render = () => {
      const settings = get();
      Object.entries(settings).forEach(([name, value]) => {
        const input = form.elements.namedItem(name);
        if (!input) return;
        if (input.type === 'checkbox') input.checked = Boolean(value);
        else input.value = value;
      });
    };
    form.addEventListener('change', (event) => {
      const input = event.target;
      if (!input.name) return;
      const current = get();
      current[input.name] = input.type === 'checkbox' ? input.checked : (input.name === 'reminderDays' ? Number(input.value) : input.value);
      save(current);
    });
    document.querySelector('[data-action="export"]')?.addEventListener('click', () => window.exportToCSV?.());
    document.querySelector('[data-action="new-month"]')?.addEventListener('click', () => window.resetData?.());
    document.querySelector('[data-action="clear-data"]')?.addEventListener('click', () => {
      if (!window.confirm('Remove all tracker entries and setup data from this device?')) return;
      ['budgetData', 'monthlySalary', 'lastResetMonth', 'budgetRule', 'salaryConfirmed', 'ruleSelected'].forEach((key) => localStorage.removeItem(key));
      window.location.href = 'index.html';
    });
    render();
  });
}());