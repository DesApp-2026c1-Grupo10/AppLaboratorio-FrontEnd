export interface Equipment {
  id: number;
  name: string;
  bld_id: number;
  status: string;
  is_movable: boolean;
  createdAt?: string;
  updatedAt?: string;
}
export interface Material {
  id: number;
  name: string;
  stock: number;
  unit: string;
  createdAt?: string;
  updatedAt?: string;
}
export interface Reagent {
  id: number;
  name: string;
  stock: number;
  prep_time: number;
  createdAt?: string;
  updatedAt?: string;
}