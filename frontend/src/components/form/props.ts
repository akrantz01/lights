export interface BaseProps<V, C = V> {
  value: V;
  onChange: (v: C) => void;
  name?: string;
  id?: string;
  disabled?: boolean;
}
