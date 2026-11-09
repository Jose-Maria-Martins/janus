import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { motion } from 'motion/react';
import { ArrowLeft, ArrowUp, FileText, Headset } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { data, insurerById } from '@/data';
import { useStore } from '@/data/store';
import { findAnswer, knowledge, type Answer } from '@/lib/assistant';
import { POLICY_LABEL } from '@/lib/format';

type From = 'bot' | 'person';
type Message =
  | { id: number; from: 'me'; text: string }
  | { id: number; from: From; text: string; source?: Answer['source']; offerPerson?: boolean }
  | { id: number; from: 'system'; text: string };

const PERSON = 'Marta';
const TYPING_MS = 900;

/** Chat with the assistant, which answers from the policies and says where. A person can join the same chat. */
export function AskScreen() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { policies } = useStore();
  const policy = policies.find((p) => p.id === params.get('policy'));

  const [messages, setMessages] = useState<Message[]>(() => [
    {
      id: 0,
      from: 'bot',
      text: policy
        ? `Hi! Ask me anything about your ${POLICY_LABEL[policy.type].toLowerCase()} policy with ${insurerById(policy.insurerId).name}. I answer from the policy itself and show you where it says so.`
        : `Hi! I know your ${policies.length} policies inside out. Ask me what you're covered for, what you pay or when things renew.`,
    },
  ]);
  const [typing, setTyping] = useState<From>();
  const [withPerson, setWithPerson] = useState(false);
  const [text, setText] = useState('');
  const nextId = useRef(1);
  const timers = useRef<number[]>([]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  useEffect(() => {
    if (messages.length > 1 || typing) window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' });
  }, [messages, typing]);

  const add = (m: Omit<Message, 'id'>) => setMessages((list) => [...list, { ...m, id: nextId.current++ } as Message]);
  const reply = (from: From, m: Omit<Extract<Message, { from: From }>, 'id' | 'from'>, delay = TYPING_MS) => {
    setTyping(from);
    timers.current.push(
      window.setTimeout(() => {
        setTyping(undefined);
        add({ from, ...m });
      }, delay),
    );
  };

  const asked = new Set(messages.filter((m) => m.from === 'me').map((m) => m.text));
  const suggestions = withPerson ? [] : (policy ? policy.questions.map((q) => q.q) : data.assistant.map((a) => a.q)).filter((q) => !asked.has(q));

  function ask(question: string) {
    const q = question.trim();
    if (!q || typing) return;
    add({ from: 'me', text: q });
    setText('');
    if (withPerson) {
      reply('person', { text: "Thanks! I'm checking this with the insurer and will reply here within the hour. You'll get a notification." });
      return;
    }
    const answer = knowledge(policies).find((k) => k.q === q) ?? findAnswer(q, policies, policy?.id);
    reply(
      'bot',
      answer
        ? { text: answer.a, source: answer.source }
        : { text: "I couldn't find that in your policies. Try asking another way, or talk to a person from our team.", offerPerson: true },
    );
  }

  function talkToPerson() {
    if (withPerson) return;
    setWithPerson(true);
    timers.current.forEach(clearTimeout);
    add({ from: 'system', text: `${PERSON} from the Janus team joined the chat` });
    reply('person', { text: `Hi, I'm ${PERSON}. I can see your conversation so far. What can I help with?` }, 1400);
  }

  const submit = (e: FormEvent) => {
    e.preventDefault();
    ask(text);
  };

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-20 flex items-center gap-2 bg-background px-2 py-2">
        <Button variant="ghost" size="icon" onClick={() => (window.history.state?.idx > 0 ? navigate(-1) : navigate('/'))} aria-label="Back">
          <ArrowLeft className="size-6" />
        </Button>
        <div className="min-w-0 flex-1 pl-1">
          <h1 className="truncate font-semibold">{withPerson ? `${PERSON} · Janus team` : 'Janus assistant'}</h1>
          <p className="truncate text-sm text-muted-foreground">{withPerson ? 'Replies within the hour' : 'From your policies'}</p>
        </div>
        {!withPerson && (
          <Button variant="secondary" size="sm" onClick={talkToPerson} className="mr-2">
            <Headset />
            Talk to a person
          </Button>
        )}
      </header>

      <div className="flex flex-1 flex-col gap-3 px-4 pt-3 pb-4">
        {messages.map((m) =>
          m.from === 'system' ? (
            <p key={m.id} className="py-2 text-center text-sm text-muted-foreground">
              {m.text}
            </p>
          ) : m.from === 'me' ? (
            <motion.p
              key={m.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-[80%] self-end rounded-2xl rounded-br-md bg-primary px-4 py-2.5 text-white"
            >
              {m.text}
            </motion.p>
          ) : (
            <BotMessage key={m.id} from={m.from}>
              <p>{m.text}</p>
              {m.source && (
                <Link
                  to={m.source.to ?? '/policies'}
                  className="mt-2.5 flex gap-2 border-t border-border pt-2.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  <FileText className="mt-0.5 size-4 shrink-0" />
                  <span>{m.source.label}</span>
                </Link>
              )}
              {m.offerPerson && !withPerson && (
                <Button size="sm" onClick={talkToPerson} className="mt-3">
                  <Headset />
                  Talk to a person
                </Button>
              )}
            </BotMessage>
          ),
        )}
        {typing && (
          <BotMessage from={typing}>
            <span className="flex h-6 items-center gap-1" aria-label="Typing">
              {[0, 1, 2].map((i) => (
                <motion.span
                  key={i}
                  className="size-2 rounded-full bg-muted-foreground"
                  animate={{ y: [0, -4, 0] }}
                  transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                />
              ))}
            </span>
          </BotMessage>
        )}
      </div>

      <div className="sticky bottom-0 bg-gradient-to-t from-background from-80% to-transparent pt-4 pb-[max(16px,env(safe-area-inset-bottom))]">
        {suggestions.length > 0 && (
          <div className="no-scrollbar flex gap-2 overflow-x-auto px-4 pb-3">
            {suggestions.map((q) => (
              <Button key={q} variant="secondary" size="sm" onClick={() => ask(q)} disabled={!!typing}>
                {q}
              </Button>
            ))}
          </div>
        )}
        <form onSubmit={submit} className="relative px-4">
          <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="Ask about your policies" className="rounded-full pr-14" aria-label="Your question" />
          <Button type="submit" size="icon-sm" disabled={!text.trim() || !!typing} aria-label="Send" className="absolute top-1.5 right-5.5">
            <ArrowUp />
          </Button>
        </form>
      </div>
    </div>
  );
}

function Avatar({ from }: { from: From }) {
  return from === 'bot' ? (
    <img src="/favicon.svg" alt="" className="size-8 shrink-0 rounded-full" />
  ) : (
    <span className="grid size-8 shrink-0 place-items-center rounded-full bg-success text-sm font-bold text-background">{PERSON[0]}</span>
  );
}

function BotMessage({ from, children }: { from: From; children: ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex max-w-[85%] items-end gap-2">
      <Avatar from={from} />
      <div className="min-w-0 rounded-2xl rounded-bl-md bg-card px-4 py-2.5">{children}</div>
    </motion.div>
  );
}
