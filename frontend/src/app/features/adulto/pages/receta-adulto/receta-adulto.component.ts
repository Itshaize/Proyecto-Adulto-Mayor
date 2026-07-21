import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AdultoDataService } from '../../services/adulto-data.service';
@Component({ selector: 'app-receta-adulto', imports: [RouterLink], templateUrl: './receta-adulto.component.html', styleUrl: './receta-adulto.component.scss' })
export class RecetaAdultoComponent { readonly data = inject(AdultoDataService); }
