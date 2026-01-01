import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TeacherSidebarComponent } from './teacher-sidebar/teacher-sidebar.component';
import { RoleNavbarComponent } from '../components/role-navbar/role-navbar.component';

@Component({
  selector: 'app-teacher',
  standalone: true,
  imports: [RouterOutlet, TeacherSidebarComponent, RoleNavbarComponent],
  templateUrl: './teacher.component.html',
  styleUrls: ['./teacher.component.css']
})
export class TeacherComponent {
}

