import { Component, OnInit } from '@angular/core';
import { Router, NavigationEnd, RouterOutlet, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { User } from '../../models/models';
import { filter } from 'rxjs/operators';

interface NavItem {
  label:    string;
  icon:     string;
  route:    string;
  clause?:  string;
  disabled?: boolean;
  roles:    string[];  // ← rôles autorisés
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  currentUser: User | null = null;
  sidebarCollapsed = false;
  activeRoute      = '';
  showUserMenu     = false;

  // Toutes les entrées de nav avec les rôles autorisés
  allNavItems: NavItem[] = [
    {
      label:  'Organismes',
      icon:   'building',
      route:  '/dashboard/organisms',
      clause: 'Administration',
      roles:  ['super_admin', 'admin_organism']
    },
    {
      label:  'Contexte',
      icon:   'context',
      route:  '/dashboard/clause4',
      clause: 'Clause 4',
      roles:  ['super_admin', 'rssi']
    },
    {
      label:    'Leadership',
      icon:     'leader',
      route:    '',
      clause:   'Clause 5',
      disabled: true,
      roles:    ['super_admin', 'rssi']
    },
    {
      label:    'Planification',
      icon:     'plan',
      route:    '',
      clause:   'Clause 6',
      disabled: true,
      roles:    ['super_admin', 'rssi']
    },
    {
      label:    'Support',
      icon:     'support',
      route:    '',
      clause:   'Clause 7',
      disabled: true,
      roles:    ['super_admin', 'rssi']
    },
    {
      label:    'Réalisation',
      icon:     'realise',
      route:    '',
      clause:   'Clause 8',
      disabled: true,
      roles:    ['super_admin', 'rssi']
    },
    {
      label:    'Évaluation',
      icon:     'eval',
      route:    '',
      clause:   'Clause 9',
      disabled: true,
      roles:    ['super_admin', 'rssi']
    },
    {
      label:    'Amélioration',
      icon:     'improve',
      route:    '',
      clause:   'Clause 10',
      disabled: true,
      roles:    ['super_admin', 'rssi']
    }
  ];

  constructor(private auth: AuthService, private router: Router) {}

  ngOnInit(): void {
    this.currentUser = this.auth.getCurrentUser();
    this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe((e: any) => { this.activeRoute = e.url; });
    this.activeRoute = this.router.url;
  }

  // Items visibles selon le rôle
  get navItems(): NavItem[] {
    const role = this.currentUser?.role || '';
    return this.allNavItems.filter(item => item.roles.includes(role));
  }

  get userInitials(): string {
    if (!this.currentUser) return 'AD';
    return (this.currentUser.prenom[0] + this.currentUser.nom[0]).toUpperCase();
  }

  get roleLabel(): string {
    const labels: Record<string, string> = {
      super_admin:    'Super Administrateur',
      admin_organism: 'Admin Organisme',
      rssi:           'RSSI'
    };
    return labels[this.currentUser?.role || ''] || this.currentUser?.role || '';
  }

  navigate(item: NavItem): void {
    if (item.disabled || !item.route) return;
    this.router.navigate([item.route]);
  }

  isActive(route: string): boolean { return route ? this.activeRoute.startsWith(route) : false; }
  toggleSidebar():  void { this.sidebarCollapsed = !this.sidebarCollapsed; }
  toggleUserMenu(): void { this.showUserMenu = !this.showUserMenu; }
  logout():         void { this.auth.logout(); }
}