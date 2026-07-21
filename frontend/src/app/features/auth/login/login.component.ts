import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { environment } from '../../../../environments/environment';

@Component({ selector: 'app-login', imports: [ReactiveFormsModule], templateUrl: './login.component.html', styleUrl: './login.component.scss' })
export class LoginComponent {
  readonly modoDemo = environment.demoMode;
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  readonly mostrarPassword = signal(false);
  readonly enviando = signal(false);
  readonly error = signal('');
  readonly formulario = this.fb.nonNullable.group({ correo: ['', [Validators.required, Validators.email]], password: ['', [Validators.required, Validators.minLength(6)]] });

  usarAdulto() { this.formulario.setValue({ correo: 'adulto@kairos.com', password: 'Adulto123!' }); this.error.set(''); }
  usarAdmin() { this.formulario.setValue({ correo: 'admin@kairos.com', password: 'Admin123!' }); this.error.set(''); }
  alternarPassword() { this.mostrarPassword.update((visible) => !visible); }

  async ingresar() {
    this.error.set('');
    if (this.formulario.invalid) { this.formulario.markAllAsTouched(); return; }
    this.enviando.set(true);
    try {
      const usuario = await this.auth.iniciarSesion(this.formulario.getRawValue().correo, this.formulario.getRawValue().password);
      await this.router.navigateByUrl(this.auth.rutaInicial(usuario));
    } catch (error) { this.error.set(error instanceof Error ? error.message : 'No fue posible iniciar sesión.'); }
    finally { this.enviando.set(false); }
  }
}
