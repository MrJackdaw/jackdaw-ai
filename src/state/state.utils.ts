/** Hook helper: (all or part of) a state instance for use in local state */
export type HookState<Keys extends Array<any>, Src> = {
  [k in Keys[number]]: Src[k];
};

export type InstanceKey<T> = keyof T;
