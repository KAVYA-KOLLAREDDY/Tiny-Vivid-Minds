import { inject, Injectable } from '@angular/core';
import { ToastrService } from 'ngx-toastr';

@Injectable({
  providedIn: 'root'
})
export class LoggingService {

   private toastr = inject(ToastrService);

  onSuccess(message: string) {
    this.toastr.success(message, 'Message');
  }

  onInfo(message: string) {
    this.toastr.info(message, 'Message');
  }

  onWarning(message: string) {
    this.toastr.warning(message, 'Message');
  }

  onError(message: string) {
    this.toastr.error(message, 'Message');
  }
}
