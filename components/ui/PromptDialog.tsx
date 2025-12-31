"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  useRef,
  useEffect,
  type ReactNode,
} from "react";

// =============================================================================
// Prompt Dialog Types
// =============================================================================

type PromptOptions = {
  title?: string;
  message: string;
  placeholder?: string;
  defaultValue?: string;
  confirmLabel?: string;
  cancelLabel?: string;
};

type PromptContextValue = {
  prompt: (options: PromptOptions) => Promise<string | null>;
};

// =============================================================================
// Prompt Dialog Context
// =============================================================================

const PromptContext = createContext<PromptContextValue | null>(null);

export function usePrompt() {
  const ctx = useContext(PromptContext);
  if (!ctx) {
    throw new Error("usePrompt must be used within PromptProvider");
  }
  return ctx.prompt;
}

// =============================================================================
// Prompt Provider
// =============================================================================

type PendingPrompt = {
  options: PromptOptions;
  resolve: (value: string | null) => void;
};

export function PromptProvider({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState<PendingPrompt | null>(null);

  const prompt = useCallback((options: PromptOptions): Promise<string | null> => {
    return new Promise((resolve) => {
      setPending({ options, resolve });
    });
  }, []);

  const handleSubmit = useCallback(
    (value: string) => {
      pending?.resolve(value);
      setPending(null);
    },
    [pending]
  );

  const handleCancel = useCallback(() => {
    pending?.resolve(null);
    setPending(null);
  }, [pending]);

  return (
    <PromptContext.Provider value={{ prompt }}>
      {children}
      {pending && (
        <PromptDialog
          options={pending.options}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />
      )}
    </PromptContext.Provider>
  );
}

// =============================================================================
// Prompt Dialog Component
// =============================================================================

function PromptDialog({
  options,
  onSubmit,
  onCancel,
}: {
  options: PromptOptions;
  onSubmit: (value: string) => void;
  onCancel: () => void;
}) {
  const {
    title = "Input",
    message,
    placeholder = "",
    defaultValue = "",
    confirmLabel = "OK",
    cancelLabel = "Cancel",
  } = options;

  const [value, setValue] = useState(defaultValue);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim()) {
      onSubmit(value.trim());
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[200]">
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 max-w-md w-full mx-4 shadow-xl">
        <h2 className="text-lg font-semibold text-white mb-2">{title}</h2>
        <p className="text-sm text-slate-300 mb-4">{message}</p>
        <form onSubmit={handleSubmit}>
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={placeholder}
            className="w-full bg-slate-900 border border-slate-600 rounded-md px-3 py-2 text-sm text-white placeholder-slate-400 mb-6"
          />
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-sm rounded-md border border-slate-600 text-slate-200 hover:bg-slate-700"
            >
              {cancelLabel}
            </button>
            <button
              type="submit"
              disabled={!value.trim()}
              className="px-4 py-2 text-sm rounded-md font-semibold bg-emerald-500 hover:bg-emerald-400 text-slate-900 disabled:opacity-50"
            >
              {confirmLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
