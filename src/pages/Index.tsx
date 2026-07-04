import { useState } from 'react';
import Icon from '@/components/ui/icon';
import { Switch } from '@/components/ui/switch';

const stats = [
  { label: 'Удалено сообщений', value: '1 284', icon: 'Trash2', trend: '+12%' },
  { label: 'Выдано предупреждений', value: '347', icon: 'AlertTriangle', trend: '+4%' },
  { label: 'Забанено', value: '52', icon: 'ShieldBan', trend: '-8%' },
  { label: 'Активных участников', value: '8 910', icon: 'Users', trend: '+2%' },
];

const filters = [
  { id: 'links', name: 'Ссылки и реклама', desc: 'Удаляет сообщения с внешними ссылками', on: true, icon: 'Link' },
  { id: 'spam', name: 'Спам и флуд', desc: 'Повторяющиеся сообщения от одного участника', on: true, icon: 'Repeat' },
  { id: 'words', name: 'Стоп-слова', desc: 'Мат и запрещённая лексика из словаря', on: true, icon: 'MessageSquareOff' },
  { id: 'media', name: 'Медиа от новичков', desc: 'Фото и видео до 24 часов в чате', on: false, icon: 'ImageOff' },
  { id: 'caps', name: 'КАПС и эмодзи-флуд', desc: 'Сообщения из заглавных букв', on: false, icon: 'CaseUpper' },
];

const summary = [
  { period: 'Сегодня', deleted: 84, warns: 21, bans: 3 },
  { period: 'За неделю', deleted: 512, warns: 138, bans: 19 },
  { period: 'За месяц', deleted: 1284, warns: 347, bans: 52 },
];

export default function Index() {
  const [active, setActive] = useState(filters.map((f) => f.on));
  const [warnLimit, setWarnLimit] = useState(3);
  const [banAction, setBanAction] = useState<'ban' | 'mute' | 'kick'>('ban');
  const [period, setPeriod] = useState(2);

  return (
    <div className="relative min-h-screen bg-background text-foreground font-sans antialiased overflow-hidden">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[400px] grid-bg" />

      <div className="relative mx-auto max-w-6xl px-5 py-8 md:px-8 md:py-12">
        <header className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between animate-fade-up">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary shadow-lg shadow-primary/30">
              <Icon name="ShieldCheck" size={26} className="text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight md:text-2xl">Модератор-бот</h1>
              <div className="mt-0.5 flex items-center gap-2 text-sm text-muted-foreground">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-[hsl(var(--success))] animate-pulse-dot" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-[hsl(var(--success))]" />
                </span>
                Онлайн · @my_chat_moderator_bot
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-medium transition hover:border-primary/60">
              <Icon name="Settings" size={16} />
              Настройки
            </button>
            <button className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition hover:brightness-110">
              <Icon name="Plus" size={16} />
              Добавить в чат
            </button>
          </div>
        </header>

        <section className="mt-10 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {stats.map((s, i) => (
            <div
              key={s.label}
              className="animate-fade-up rounded-xl border border-border bg-card p-4 transition hover:border-primary/40"
              style={{ animationDelay: `${80 + i * 60}ms`, opacity: 0 }}
            >
              <div className="flex items-center justify-between">
                <Icon name={s.icon} size={18} className="text-muted-foreground" />
                <span className={`font-mono text-xs ${s.trend.startsWith('-') ? 'text-[hsl(var(--success))]' : 'text-primary'}`}>{s.trend}</span>
              </div>
              <div className="mt-3 font-mono text-2xl font-bold tracking-tight md:text-3xl">{s.value}</div>
              <div className="mt-1 text-xs text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </section>

        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          <section
            className="animate-fade-up rounded-2xl border border-border bg-card p-5 lg:col-span-2"
            style={{ animationDelay: '340ms', opacity: 0 }}
          >
            <div className="mb-5 flex items-center gap-2">
              <Icon name="Filter" size={18} className="text-primary" />
              <h2 className="text-base font-semibold">Автоудаление сообщений</h2>
            </div>
            <div className="space-y-2">
              {filters.map((f, i) => (
                <label
                  key={f.id}
                  className="flex cursor-pointer items-center gap-4 rounded-xl border border-transparent bg-secondary/40 px-4 py-3.5 transition hover:bg-secondary/70"
                >
                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${active[i] ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'}`}>
                    <Icon name={f.icon} size={18} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium">{f.name}</div>
                    <div className="truncate text-xs text-muted-foreground">{f.desc}</div>
                  </div>
                  <Switch
                    checked={active[i]}
                    onCheckedChange={(v) => setActive((a) => a.map((x, idx) => (idx === i ? v : x)))}
                  />
                </label>
              ))}
            </div>
          </section>

          <section
            className="animate-fade-up rounded-2xl border border-border bg-card p-5"
            style={{ animationDelay: '420ms', opacity: 0 }}
          >
            <div className="mb-5 flex items-center gap-2">
              <Icon name="Gavel" size={18} className="text-[hsl(var(--warning))]" />
              <h2 className="text-base font-semibold">Предупреждения</h2>
            </div>

            <div className="rounded-xl bg-secondary/40 p-4">
              <div className="text-xs text-muted-foreground">Автобан после нарушений</div>
              <div className="mt-3 flex items-center justify-between">
                <button
                  onClick={() => setWarnLimit((n) => Math.max(1, n - 1))}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-border transition hover:border-primary/60"
                >
                  <Icon name="Minus" size={16} />
                </button>
                <span className="font-mono text-4xl font-bold text-primary">{warnLimit}</span>
                <button
                  onClick={() => setWarnLimit((n) => Math.min(10, n + 1))}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-border transition hover:border-primary/60"
                >
                  <Icon name="Plus" size={16} />
                </button>
              </div>
            </div>

            <div className="mt-4">
              <div className="mb-2 text-xs text-muted-foreground">Действие при превышении</div>
              <div className="grid grid-cols-3 gap-2">
                {([
                  { id: 'mute', label: 'Мут', icon: 'MicOff' },
                  { id: 'kick', label: 'Кик', icon: 'LogOut' },
                  { id: 'ban', label: 'Бан', icon: 'Ban' },
                ] as const).map((a) => (
                  <button
                    key={a.id}
                    onClick={() => setBanAction(a.id)}
                    className={`flex flex-col items-center gap-1.5 rounded-xl border py-3 text-xs font-medium transition ${
                      banAction === a.id
                        ? 'border-primary bg-primary/15 text-primary'
                        : 'border-border bg-secondary/40 text-muted-foreground hover:border-primary/40'
                    }`}
                  >
                    <Icon name={a.icon} size={18} />
                    {a.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-4 flex items-start gap-2 rounded-lg bg-[hsl(var(--warning))]/10 p-3 text-xs text-[hsl(var(--warning))]">
              <Icon name="Info" size={14} className="mt-0.5 shrink-0" />
              <span>После {warnLimit} предупреждений участник получит: {banAction === 'ban' ? 'вечный бан' : banAction === 'kick' ? 'исключение' : 'мут на 24 часа'}</span>
            </div>
          </section>
        </div>

        <section
          className="animate-fade-up mt-6 rounded-2xl border border-border bg-card p-5"
          style={{ animationDelay: '500ms', opacity: 0 }}
        >
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Icon name="BarChart3" size={18} className="text-primary" />
              <h2 className="text-base font-semibold">Сводка активности</h2>
            </div>
            <div className="flex gap-1 rounded-lg bg-secondary/40 p-1">
              {summary.map((s, i) => (
                <button
                  key={s.period}
                  onClick={() => setPeriod(i)}
                  className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
                    period === i ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {s.period}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Удалено', value: summary[period].deleted, icon: 'Trash2', color: 'text-primary' },
              { label: 'Предупреждений', value: summary[period].warns, icon: 'AlertTriangle', color: 'text-[hsl(var(--warning))]' },
              { label: 'Банов', value: summary[period].bans, icon: 'ShieldBan', color: 'text-destructive' },
            ].map((m) => (
              <div key={m.label} className="rounded-xl bg-secondary/40 p-4">
                <Icon name={m.icon} size={18} className={m.color} />
                <div className="mt-3 font-mono text-2xl font-bold md:text-3xl">{m.value}</div>
                <div className="mt-1 text-xs text-muted-foreground">{m.label}</div>
              </div>
            ))}
          </div>
        </section>

        <footer className="mt-8 text-center text-xs text-muted-foreground">
          Модератор-бот · панель управления Telegram-чатом
        </footer>
      </div>
    </div>
  );
}
