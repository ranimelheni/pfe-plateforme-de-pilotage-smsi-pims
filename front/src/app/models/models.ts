export interface User {
  id: number;
  email: string;
  nom: string;
  prenom: string;
  role: string;
  telephone?: string;
  is_active: boolean;
  must_change_password?: boolean;  // ← AJOUT
  organism_id?: number;
  organism?: string;
  processus_pilote?: string;       // ← AJOUT
  created_at?: string;
  last_login?: string;
}

export interface Organism {
  id: number;
  nom: string;
  secteur?: string;
  type_org?: string;
  audit_type?: string;             // ← AJOUT
  siret?: string;
  adresse?: string;
  ville?: string;
  pays?: string;
  email_contact?: string;
  telephone?: string;
  site_web?: string;
  taille?: string;
  description?: string;
  is_active: boolean;
  date_audit?: string;
  nb_acteurs?: number;
  created_at?: string;
}

export interface Role {
  value: string;
  label: string;
}

export interface AuthResponse {
  access_token:          string;
  refresh_token:         string;
  must_change_password:  boolean;  // ← AJOUT
  user:                  User;
}

export const SECTEURS = [
  { value: 'public',       label: 'Public' },
  { value: 'prive',        label: 'Privé' },
  { value: 'associatif',   label: 'Associatif' },
  { value: 'sante',        label: 'Santé' },
  { value: 'education',    label: 'Éducation' },
  { value: 'finance',      label: 'Finance' },
  { value: 'industrie',    label: 'Industrie' },
  { value: 'collectivite', label: 'Collectivité' }
];

export const TYPES_ORG = [
  { value: 'entreprise',     label: 'Entreprise' },
  { value: 'administration', label: 'Administration' },
  { value: 'hopital',        label: 'Hôpital / Établissement santé' },
  { value: 'collectivite',   label: 'Collectivité territoriale' },
  { value: 'association',    label: 'Association' },
  { value: 'universite',     label: 'Université / École' }
];

export const TAILLES = [
  { value: 'tpe',            label: 'TPE (< 10 salariés)' },
  { value: 'pme',            label: 'PME (10-250 salariés)' },
  { value: 'eti',            label: 'ETI (250-5000 salariés)' },
  { value: 'ge',             label: 'GE (> 5000 salariés)' },
  { value: 'administration', label: 'Administration publique' }
];