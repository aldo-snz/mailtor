import {useEffect, useRef} from 'react';
import {attachEmailValidation} from 'mailtor/inline';

export function EmailField() {
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => input.current ? attachEmailValidation(input.current, {mode:'blur'}) : undefined, []);
  return <label>Email <input ref={input} name="email" type="text" autoComplete="email" /></label>;
}
