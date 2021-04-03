interface IteratorYieldResult<Tyield> {
  done?: false;
  value: Tyield;
}

interface IteratorReturnResult<Treturn> {
  done: true;
  value: Treturn;
}

type IteratorResult<Tyield, Treturn> =
  | IteratorYieldResult<Tyield>
  | IteratorReturnResult<Treturn>;

interface Generator<T = unknown, Treturn = unknown, Tnext = unknown> {
  next(...args: [] | [Tnext]): IteratorResult<T, Treturn>;
  return(value: Treturn): IteratorResult<T, Treturn>;
  throw(e: unknown): IteratorResult<T, Treturn>;
  [Symbol.iterator](): Generator<T, Treturn, Tnext>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

type Class<T = Any> = new (...args: unknown[]) => T;

export { Generator, Class };
