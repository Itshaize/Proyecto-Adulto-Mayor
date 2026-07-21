import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AdultoDemoService } from '../../services/adulto-demo.service';
@Component({ selector: 'app-receta-adulto', imports: [RouterLink], templateUrl: './receta-adulto.component.html', styleUrl: './receta-adulto.component.scss' })
export class RecetaAdultoComponent { readonly data = inject(AdultoDemoService); }
