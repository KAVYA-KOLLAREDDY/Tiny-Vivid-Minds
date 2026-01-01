import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { StudentSidebarComponent } from './student-sidebar/student-sidebar.component';
import { RoleNavbarComponent } from '../components/role-navbar/role-navbar.component';

@Component({
  selector: 'app-student',
  standalone: true,
  imports: [RouterOutlet, StudentSidebarComponent, RoleNavbarComponent],
  templateUrl: './student.component.html',
  styleUrls: ['./student.component.css']
})
export class StudentComponent {
}

