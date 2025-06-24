import * as React from 'react';

const TOAST_LIMIT = 3;
const TOAST_REMOVE_DELAY = 10000;

type ToastType = 'default' | 'destructive';

type ToastProps = {
  id: string;
  title?: string;
  description?: string;
  type?: ToastType;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type ToastActionElement = React.ReactElement<{
  toastId: string;
  onClose: () => void;
}>;

type Toast = {
  id: string;
  title?: string;
  description?: string;
  type?: ToastType;
  action?: ToastActionElement;
};

type ToasterToast = Toast & {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  timer?: NodeJS.Timeout;
};

const actionTypes = {
  ADD_TOAST: 'ADD_TOAST',
  UPDATE_TOAST: 'UPDATE_TOAST',
  DISMISS_TOAST: 'DISMISS_TOAST',
  REMOVE_TOAST: 'REMOVE_TOAST',
} as const;

type ActionType = typeof actionTypes;

type Action = 
  | { type: ActionType['ADD_TOAST']; toast: Toast }
  | { type: ActionType['UPDATE_TOAST']; toast: Partial<Toast> & { id: string } }
  | { type: ActionType['DISMISS_TOAST']; toastId?: string }
  | { type: ActionType['REMOVE_TOAST']; toastId?: string };

interface State {
  toasts: ToasterToast[];
}

const toastTimeouts = new Map<string, NodeJS.Timeout>();

const addToRemoveQueue = (toastId: string) => {
  if (toastTimeouts.has(toastId)) {
    return;
  }

  const timeout = setTimeout(() => {
    toastTimeouts.delete(toastId);
    dispatch({ type: actionTypes.REMOVE_TOAST, toastId });
  }, TOAST_REMOVE_DELAY);

  toastTimeouts.set(toastId, timeout);
};

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case actionTypes.ADD_TOAST: {
      return {
        ...state,
        toasts: [
          { ...action.toast, open: true, onOpenChange: () => {} },
          ...state.toasts
        ].slice(0, TOAST_LIMIT),
      };
    }

    case actionTypes.UPDATE_TOAST: {
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === action.toast.id ? { ...t, ...action.toast } : t
        ),
      };
    }

    case actionTypes.DISMISS_TOAST: {
      const { toastId } = action;

      if (toastId) {
        addToRemoveQueue(toastId);
        return {
          ...state,
          toasts: state.toasts.map((t) =>
            t.id === toastId ? { ...t, open: false } : t
          ),
        };
      }

      state.toasts.forEach((toast) => {
        addToRemoveQueue(toast.id);
      });

      return {
        ...state,
        toasts: state.toasts.map((t) => ({ ...t, open: false })),
      };
    }

    case actionTypes.REMOVE_TOAST: {
      if (action.toastId) {
        return {
          ...state,
          toasts: state.toasts.filter((t) => t.id !== action.toastId),
        };
      }

      return {
        ...state,
        toasts: [],
      };
    }
  }
};

const listeners: Array<(state: State) => void> = [];

let memoryState: State = { toasts: [] };

function dispatch(action: Action) {
  memoryState = reducer(memoryState, action);
  listeners.forEach((listener) => listener(memoryState));
}

type ToastOptions = {
  description?: string;
  type?: ToastType; // 保持与现有类型一致
  action?: ToastActionElement;
  variant?: ToastType; // 添加variant属性，类型与ToastType一致
};


type ToastReturn = {
  id: string;
  dismiss: () => void;
};

/**
 * 创建并显示一个新的Toast通知
 * @param title Toast标题
 * @param options Toast选项，包括描述、类型和操作按钮
 * @returns Toast的ID和关闭函数
 */
function toast(title: string, options: ToastOptions = {}): ToastReturn {
  const id = crypto.randomUUID();

  const toast: Toast = {
    id,
    title,
    ...options,
  };

  dispatch({ type: actionTypes.ADD_TOAST, toast });

  return {
    id,
    dismiss: () => dispatch({ type: actionTypes.DISMISS_TOAST, toastId: id }),
  };
}

/**
 * 自定义Hook，用于访问Toast上下文和控制Toast显示
 * @returns 包含toast函数、toasts数组和dismiss函数的对象
 */
function useToast() {
  const [state, setState] = React.useState<State>(memoryState);

  React.useEffect(() => {
    listeners.push(setState);
    return () => {
      const index = listeners.indexOf(setState);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  }, [state]);

  return {
    toast,
    toasts: state.toasts,
    dismiss: (toastId?: string) => dispatch({ type: actionTypes.DISMISS_TOAST, toastId }),
  };
}

export { useToast, toast };

export type { ToastProps };