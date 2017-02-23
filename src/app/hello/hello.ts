import { Component } from '@angular/core';

@Component({
    selector: 'app-hello',
    template: require('./hello.html'),
})
export class HelloComponent {
    title = 'Hello :)';
}
