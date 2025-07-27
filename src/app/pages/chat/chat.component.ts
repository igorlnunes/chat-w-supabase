import { Component, effect, inject, signal } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ChatService } from '../../supabase/chat.service';
import { Ichat } from '../../interface/chat-response';
import { DatePipe, NgIf } from '@angular/common';
import { DeleteModalComponent } from '../../layout/delete-modal/delete-modal.component';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [ReactiveFormsModule, DatePipe, DeleteModalComponent, NgIf],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.css'
})
export class ChatComponent {
  private auth = inject(AuthService);
  private chat_service = inject(ChatService);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  chats = signal<Ichat[]>([]);
  replyingToMessage: Ichat | null = null;
  
  chatForm!: FormGroup;

  constructor() {
    this.chatForm = this.fb.group({
      chat_message: ['', Validators.required]
    })

    effect(() => {
      this.onListChat();
    })
  }

  async logOut() {
    this.auth.signOut().then(() => {
      this.router.navigate(['/login'])
    }).catch((err) => {
      alert(err.message)
    })
  }

  onSubmit() {
    const formValue = this.chatForm.value.chat_message;
    console.log(formValue);

    this.chat_service.chatMessage(formValue).then((res) => {
      console.log(res);
      this.chatForm.reset();
      this.onListChat();
    }).catch((err) => {
      alert(err.message);
    })
  }

  onListChat() {
    this.chat_service.listChat().then((res: Ichat[] | null) => {
      console.log(res);
      if(res !== null) {
        this.chats.set(res.map(chat => ({ ...chat, showActions: false })))
      } else {
        console.log("No messages found.")
      }
    }).catch((err) => {
      alert(err.message);
    })
  }

  openDropDown(msg: Ichat) {
    console.log(msg);
    this.chat_service.selectedChats(msg);
  }

  replyToMessage(message: Ichat): void {
    this.replyingToMessage = message;
    // Opcional: focar no campo de input após selecionar a resposta
    // this.chatForm.get('chat_message')?.focus();
  }

  formatMessage(text: string ): string {
    // Substitui @nome_do_usuario por um span com destaque
    return text.replace(/@(\w+)/g, '<span class="mention">@$1</span>');
}

clearReply(): void {
    this.replyingToMessage = null; // Define como nulo para ocultar a pré-visualização
  }

  copyMessage(text: string) {
    navigator.clipboard.writeText(text).then(() => {
      // Opcional: adicione um feedback visual para o usuário, como um tooltip ou um toast
      console.log('Message copied to clipboard');
    }).catch(err => {
      console.error('Error copying message: ', err);
    });
  }

  showMessageActions(message: Ichat) {
    message.showActions = true;
  }

  hideMessageActions(message: Ichat) {
    message.showActions = false;
  }
}
