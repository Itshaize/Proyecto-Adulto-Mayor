import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AdultoDataService } from '../../services/adulto-data.service';
import { BotonLlamarHijoComponent } from '../../components/boton-llamar-hijo/boton-llamar-hijo.component';

@Component({ selector: 'app-ayuda-adulto', imports: [RouterLink, BotonLlamarHijoComponent], templateUrl: './ayuda-adulto.component.html', styleUrl: './ayuda-adulto.component.scss' })
export class AyudaAdultoComponent { readonly data = inject(AdultoDataService); }
