import { Component, EventEmitter, Input, Output } from '@angular/core';
@Component({selector:'app-boton-confirmar-toma',template:`<button class="primary-button" type="button" [disabled]="disabled" (click)="confirmar.emit()">✓ Ya tomé mi pastilla</button>`,styles:[`button{width:100%}@media(min-width:768px){button{width:auto}}`]})
export class BotonConfirmarTomaComponent{@Input() disabled=false;@Output() confirmar=new EventEmitter<void>();}
