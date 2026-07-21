import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-boton-llamar-hijo',
  template: `<a class="primary-button call-button" [href]="'tel:' + telefono"><span aria-hidden="true">☎</span> Llamar a mi hijo</a>`,
  styles: [`.call-button{width:100%;min-width:210px}.call-button span{font-size:24px}@media(min-width:768px){.call-button{width:auto}}`],
})
export class BotonLlamarHijoComponent { @Input({ required: true }) telefono = ''; }
