import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-boton-llamar-hijo',
  template: `<div class="call-wrap"><a class="primary-button call-button" [href]="'tel:' + telefono"><span aria-hidden="true">☎</span> Llamar a mi hijo</a><p class="desktop-help">Teléfono: <strong>{{ telefono }}</strong><br>Llame desde su celular si está en una computadora.</p></div>`,
  styles: [`
    :host,.call-wrap,.call-button{width:100%}
    .call-wrap{display:flex;flex-direction:column;align-items:stretch}
    .call-button{min-width:210px}
    .call-button span{font-size:24px}
    .desktop-help{display:none;margin:0;color:var(--muted);text-align:center}
    @media(min-width:768px){
      :host{display:block;min-width:310px}
      .call-wrap{align-items:center;justify-content:center}
      .call-button{width:auto;min-width:240px;padding-inline:28px}
      .desktop-help{display:block;width:100%;margin-top:11px;font-size:14px;line-height:1.55}
    }
  `],
})
export class BotonLlamarHijoComponent { @Input({ required: true }) telefono = ''; }
