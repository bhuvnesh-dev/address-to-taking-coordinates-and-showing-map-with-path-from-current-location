import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { MapViewPageRoutingModule } from './map-view-routing.module';

import { MapViewPage } from './map-view.page';
import { Storage } from '@ionic/storage-angular';
import { GeocodingService } from 'src/providers/GeocodingServices';
import { InAppBrowser } from '@ionic-native/in-app-browser/ngx';
import { Diagnostic } from '@ionic-native/diagnostic/ngx';
import { Device } from '@ionic-native/device/ngx';
import { Geolocation } from '@ionic-native/geolocation/ngx';
import { OpenNativeSettings } from '@awesome-cordova-plugins/open-native-settings/ngx';
import { LaunchNavigator } from '@ionic-native/launch-navigator/ngx';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    MapViewPageRoutingModule
  ],
  providers: [Storage, GeocodingService, LaunchNavigator, InAppBrowser, Diagnostic, Device, Geolocation, OpenNativeSettings],
  schemas:[CUSTOM_ELEMENTS_SCHEMA],
  declarations: [MapViewPage],
})
export class MapViewPageModule {}
