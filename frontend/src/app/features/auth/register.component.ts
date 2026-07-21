import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-register', standalone: true, imports: [ReactiveFormsModule, RouterLink],
  template: `
    <main class="register-page">
      <section class="register-story" aria-label="Beneficios de KAIRÓS">
        <a class="brand" routerLink="/login"><img src="assets/kairos-logo.svg" alt="KAIRÓS" /></a>
        <div class="story-copy"><span class="eyebrow">CUENTA FAMILIAR</span><h1>Empieza a cuidar con información clara.</h1><p>Crea tu cuenta de administrador. Después podrás registrar hasta dos adultos mayores y entregarles su propio acceso.</p></div>
        <div class="trust-list"><span><b>01</b> La cuenta creada siempre será de administrador.</span><span><b>02</b> Cada adulto tendrá correo y contraseña independientes.</span><span><b>03</b> Los datos clínicos permanecen vinculados a la familia.</span></div>
      </section>
      <section class="register-panel">
        <form [formGroup]="form" (ngSubmit)="submit()" novalidate>
          <a class="mobile-brand" routerLink="/login"><img src="assets/kairos-logo.svg" alt="KAIRÓS" /></a>
          <span class="eyebrow">NUEVO ADMINISTRADOR</span><h2>Crea tu cuenta</h2><p class="intro">Usa tus datos reales para que el adulto pueda contactarte.</p>
          @if(error){<div class="inline-error" role="alert">{{error}}</div>}
          <div class="form-field"><label for="nombre">Nombre completo</label><input id="nombre" class="input" type="text" formControlName="nombre" autocomplete="name" placeholder="Ej. Daniela Pérez">@if(invalid('nombre')){<small class="field-error">Escribe al menos 3 caracteres.</small>}</div>
          <div class="form-grid"><div class="form-field"><label for="correo">Correo electrónico</label><input id="correo" class="input" type="email" formControlName="correo" autocomplete="email" placeholder="familia@correo.com">@if(invalid('correo')){<small class="field-error">Ingresa un correo válido.</small>}</div><div class="form-field"><label for="telefono">Teléfono</label><input id="telefono" class="input" type="tel" formControlName="telefono" autocomplete="tel" placeholder="+593 99 000 0000">@if(invalid('telefono')){<small class="field-error">Ingresa un teléfono válido.</small>}</div></div>
          <div class="form-grid"><div class="form-field"><label for="password">Contraseña</label><input id="password" class="input" type="password" formControlName="password" autocomplete="new-password">@if(invalid('password')){<small class="field-error">Mínimo 8 caracteres, mayúscula, minúscula y número.</small>}</div><div class="form-field"><label for="confirmacion">Confirmar contraseña</label><input id="confirmacion" class="input" type="password" formControlName="confirmacion" autocomplete="new-password">@if(passwordMismatch){<small class="field-error">Las contraseñas no coinciden.</small>}</div></div>
          <button class="btn btn-primary submit" type="submit" [disabled]="loading">{{loading?'Creando cuenta…':'Crear cuenta de administrador'}}</button>
          <p class="login-link">¿Ya tienes una cuenta? <a routerLink="/login">Iniciar sesión</a></p>
          <p class="privacy">Al continuar aceptas usar KAIRÓS únicamente para el cuidado familiar autorizado.</p>
        </form>
      </section>
    </main>`,
  styles: [`
    .register-page{min-height:100dvh;display:grid;background:#f5fafc}.register-story{display:none}.register-panel{display:grid;place-items:center;padding:28px 18px}.register-panel form{width:min(100%,580px);padding:26px;background:white;border:1px solid var(--border);border-radius:20px;box-shadow:var(--shadow)}.brand,.mobile-brand{display:block}.brand img,.mobile-brand img{display:block;width:180px;height:auto}.mobile-brand{margin-bottom:34px}h2{margin:0 0 7px;font-size:1.75rem;letter-spacing:-.04em}.intro{margin:0 0 18px;color:var(--text-muted);line-height:1.55}.form-grid{display:grid;gap:0}.form-field{margin-top:15px}.field-error{display:block;margin-top:6px;color:var(--danger);font-size:.67rem}.submit{width:100%;margin-top:22px}.submit:active{transform:scale(.98)}.login-link,.privacy{text-align:center;color:var(--text-muted);font-size:.73rem}.login-link{margin:17px 0 0}.login-link a{color:var(--primary);font-weight:800}.privacy{margin:11px auto 0;max-width:48ch;line-height:1.5}
    @media(min-width:620px){.form-grid{grid-template-columns:1fr 1fr;gap:13px}}
    @media(min-width:960px){.register-page{grid-template-columns:minmax(430px,.88fr) minmax(580px,1.12fr)}.register-story{display:flex;position:relative;overflow:hidden;flex-direction:column;justify-content:space-between;padding:44px clamp(42px,6vw,84px);background:#eaf7f9}.register-story::after{content:'';position:absolute;width:390px;height:390px;border:70px solid rgba(15,143,165,.07);border-radius:50%;right:-160px;bottom:-120px}.story-copy,.trust-list,.brand{position:relative;z-index:1}.story-copy{max-width:590px}.story-copy h1{max-width:10ch;margin:0 0 22px;font-size:clamp(2.7rem,4.2vw,4.5rem);line-height:.98;letter-spacing:-.06em}.story-copy p{max-width:48ch;color:#4d6d77;line-height:1.7}.trust-list{display:grid;gap:11px}.trust-list span{display:grid;grid-template-columns:30px minmax(0,1fr);gap:10px;align-items:center;color:#4d6d77;font-size:.78rem}.trust-list b{width:30px;height:30px;display:grid;place-items:center;border-radius:50%;background:white;color:var(--primary);font-size:.63rem;box-shadow:0 4px 14px rgba(25,89,101,.08)}.register-panel{padding:48px}.register-panel form{padding:36px}.mobile-brand{display:none}}
  `]
})
export class RegisterComponent {
  private readonly fb=inject(FormBuilder);private readonly auth=inject(AuthService);private readonly router=inject(Router);
  loading=false;error='';
  form=this.fb.nonNullable.group({nombre:['',[Validators.required,Validators.minLength(3),Validators.maxLength(80)]],correo:['',[Validators.required,Validators.email]],telefono:['',[Validators.required,Validators.minLength(7),Validators.maxLength(20)]],password:['',[Validators.required,Validators.minLength(8),Validators.maxLength(72),Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/)]],confirmacion:['',Validators.required]});
  invalid(control:string){const field=this.form.get(control);return Boolean(field?.invalid&&(field.dirty||field.touched));}
  get passwordMismatch(){const mismatch=this.form.controls.confirmacion.value!==this.form.controls.password.value;return mismatch&&(this.form.controls.confirmacion.dirty||this.form.controls.confirmacion.touched);}
  submit(){const values=this.form.getRawValue();if(this.form.invalid||values.confirmacion!==values.password){this.form.markAllAsTouched();return;}const{nombre,correo,telefono,password}=values;this.loading=true;this.error='';this.auth.registerAdmin(nombre,correo,telefono,password).pipe(finalize(()=>this.loading=false)).subscribe({next:()=>this.router.navigateByUrl('/admin/inicio'),error:e=>this.error=e.error?.mensaje||'No pudimos crear la cuenta. Inténtalo nuevamente.'});}
}
