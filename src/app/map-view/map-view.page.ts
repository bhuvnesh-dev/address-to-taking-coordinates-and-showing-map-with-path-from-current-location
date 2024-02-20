import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { Geolocation } from '@capacitor/geolocation';
import * as GeoLocation from '@ionic-native/geolocation/ngx';
import {
  InAppBrowser,
  InAppBrowserOptions,
} from '@ionic-native/in-app-browser/ngx';
import { OpenNativeSettings } from '@awesome-cordova-plugins/open-native-settings/ngx';
import { GeocodingService } from 'src/providers/GeocodingServices';
import { AlertController, IonInput, NavController } from '@ionic/angular';
import { Storage } from '@ionic/storage-angular';
import { marker } from 'leaflet';
import 'leaflet-routing-machine';
import 'leaflet-control-geocoder';
import axios from 'axios';
declare var L: any;
declare var google: any;

@Component({
  selector: 'app-map-view',
  templateUrl: './map-view.page.html',
  styleUrls: ['./map-view.page.scss'],
})
export class MapViewPage implements OnInit {

  @ViewChild('map', { static: true }) mapElement!: ElementRef;
  @ViewChild('autoComplete') autoComplete!: IonInput;
  @ViewChild('targetElement') targetElement!: ElementRef;
  map!: L.Map;
  watchId:any;
  deviceLocation: any;
  currentAddress: any;
  source: any = { lat: 26.8289, long: 75.7646 };
  routingControl: any;
  accessToken: string =
    'pk.eyJ1IjoiYmh1dm5lc2gtdXB3b3JrZGV2IiwiYSI6ImNsMzhjYTNjNTAwNHIzaXFrNXVydGd0bnkifQ.PXqs_rSmj74pk1TXFdE5bg';
  distance: any = '';
  duration: any = '';
  destinationAddress: any;
  spinner: boolean = false;
  constructor(
    private storage: Storage,
    private geoCoding: GeocodingService,
    private navCtrl: NavController,
    private inAppBrowser: InAppBrowser,
    private checkLocationState: GeoLocation.Geolocation,
    private alertController: AlertController,
    private openNativeSettings: OpenNativeSettings,
  ) {
    storage.create();
  }
  async ngOnInit() {
    this.watchId = this.checkLocationState.watchPosition({enableHighAccuracy:true}).subscribe((data)=>{
      this.getCurrentLocation(data);
    });
  }
  onInputTime(event:any) {
    this.autoComplete.getInputElement().then((ref: any) => {
      const autoComplete = new google.maps.places.Autocomplete(ref);
      autoComplete.addListener('place_changed', () => {
        const address = autoComplete.getPlace().address_components;
        this.geoCoding
          .geocodeAddress(autoComplete.getPlace().formatted_address)
          .subscribe((res) => {
            this.source.lat = res.latitude;
            this.source.long = res.longitude;
            this.map.setView([res.latitude, res.longitude], 12);
            this.storage.set('selectedSource', res).then((res:any) => {
              this.spinner = true;
              this.SetRouting(res);
            });
          });
        this.autoComplete.value = autoComplete.getPlace().formatted_address;
      });
    });
  }
  async SetRouting(source:any) {
    if (this.routingControl) {
      this.map.removeControl(this.routingControl);
    }
    const destination1Icon = L.icon({
      iconUrl: '../../../assets/destination.svg',
      iconSize: [41, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
    });
    const sourceIcon = L.icon({
      iconUrl: '../../../assets/source.svg',
      iconSize: [41, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34], // Adjust the anchor point according to your icon
    });
    const { latitude, longitude, address } = await this.storage.get(
      'selectedDestination'
    );

    this.destinationAddress = address;
    this.routingControl = L.Routing.control({
      language: 'fr',
      locale: 'fr',
      serviceUrl: 'https://router.project-osrm.org/route/v1',
      waypoints: [
        L.latLng(source.latitude, source.longitude),
        L.latLng(latitude, longitude),
      ],
      plan: L.Routing.plan(
        [
          L.latLng(source.latitude, source.longitude),
          L.latLng(latitude, longitude),
        ],
        {
          createMarker: function (i:any, waypoint:any, n:any) {
            if (i === 0) {
              return marker(waypoint.latLng, { icon: sourceIcon });
            } else if (i !== 0) {
              return marker(waypoint.latLng, {
                icon: destination1Icon,
              }).addEventListener('click', () => {
                location.assign('same-address-voters');
              });
            }
            return L.marker(waypoint.latLng);
          },
        }
      ),
      addWaypoints: false,
      routeWhileDragging: false,
      draggableWaypoints: false,
      altLineOptions: { styles: [{ color: '#ed6852', weight: 7 }] },
      lineOptions: {
        styles: [
          {
            className: 'blink-animation',
            color: '#2196F3',
            opacity: 1,
            weight: 6,
            borderWeight: 10,
            borderColor: 'red',
          },
        ],
      },
      sliding: false,
      fitSelectedRoutes: false,
      autoRoute: true,
      showAlternatives: false,
      showSteps: false,
      show: false,
      profile: 'foot',
    }).addTo(this.map);
    L.control.zoom({
      position: 'bottomleft'
    }).addTo(this.map);
    const lineOptions = this.routingControl
    this.simulateClick();
  }

  async simulateClick() {
    try {
      this.routingControl.addEventListener('routesfound', (event:any) => {
        const routes = event.routes;
        const distance = routes[0].summary.totalDistance;
        const duration = routes[0].summary.totalTime;
        this.returnDetails(distance, duration);
      });
    } catch (error) {
      console.log(error, "error for simulateClick function ")
    }
  }
  async generateGoogleMapsUrl() {
    const { latitude, longitude, address } = await this.storage.get(
      'selectedDestination'
    );
    const source = encodeURIComponent(this.currentAddress);
    const destination = encodeURIComponent(this.destinationAddress);
    const { coords } = await Geolocation.getCurrentPosition({
      enableHighAccuracy: true,
    });
    const options: InAppBrowserOptions = {
      location: 'yes',
      hidden: 'no',
      clearcache: 'yes',
      clearsessioncache: 'yes',
      zoom: 'no',
      hardwareback: 'yes',
      mediaPlaybackRequiresUserAction: 'no',
      shouldPauseOnSuspend: 'no',
      fullscreen: 'yes',
    };
    const url = `https://www.google.com/maps/dir/?api=1&origin=${coords.latitude},${coords.longitude}&destination=${latitude},${longitude}&travelmode=driving&dir_action=navigate&start`;
    this.inAppBrowser.create(url, '_system', options);
  }
  durationFormatter(seconds:any) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}min`;
    } else {
      return `${minutes}min`;
    }
  }
  async apiData(url:any) {
    const { data } = await axios.get(url);
    this.currentAddress = "Goner Road Jaipur";
  }
  async returnLatLngtoAddress(value?: any) {
    const {
      coords: { latitude, longitude },
    } = await Geolocation.getCurrentPosition({ enableHighAccuracy: true });
    const data = this.geoCoding
      .reverseGeocode(latitude, longitude)
      .subscribe((res) => console.log(res,"res"));
  }
  returnDetails(distance?: any, duration?: any) {
    this.distance = distance;
    this.duration = duration;
  }
  gotoDetails() {
  }

  setRoundeOff(item: any) {
    return Number(item).toFixed(2);
  }

  ionViewDidLeave() {
    this.watchId.unsubscribe()
    this.map= L.Map;
    this.watchId =null;
    this.deviceLocation= null;
    this.currentAddress= null;
    this.source= { lat: 26.8289, long: 75.7646 };
    this.routingControl= null;
    this.distance = '';
    this.duration = '';
    this.destinationAddress= null;
    this.spinner = false;
    console.log(this.watchId,"watchId")
  }

  async getCurrentLocation(res:any) {
    this.spinner = true;
    try {
      const { latitude, longitude } = res.coords;
      this.deviceLocation = L.latLng(latitude, longitude);
      
      this.map = L.map('map', {
        watch: true,
        attributionControl: false,
        center: [latitude, longitude],
        zoom: 13,
        renderer: L.canvas(),
        minZoom: 4,
        zoomControl:false
      });

        var layer = new L.TileLayer(
          'https://api.mapbox.com/styles/v1/mapbox/streets-v11/tiles/{z}/{x}/{y}?access_token=pk.eyJ1IjoiYmh1dm5lc2gtdXB3b3JrZGV2IiwiYSI6ImNsMzhjYTNjNTAwNHIzaXFrNXVydGd0bnkifQ.PXqs_rSmj74pk1TXFdE5bg',
          {}
        );
        layer.addTo(this.map);
        setTimeout(() => {
          this.map.invalidateSize(true);
        }, 1000);

      this.map.setView(this.deviceLocation, this.map.getZoom());
      this.SetRouting({ latitude: latitude, longitude: longitude });
      
    } catch (error:any) {
      if(error.message === "location disabled"){
        const alert = await this.alertController.create({
          header: 'Location Access Required',
          message: 'Please enable location access to use this feature.',
          buttons: [
            {
              text: 'Cancel',
              role: 'cancel',
              handler: () => {
                console.log('Location prompt cancelled');
              }
            },
            {
              text: 'Enable',
              handler: async () => {
                await this.openNativeSettings.open('location');
              }
            }
          ]
        });
        await alert.present();
      }
      this.spinner = false;
    }

  }

  async getCurrentCoords() {
    await Geolocation.getCurrentPosition({
      enableHighAccuracy: true,
    }).then((res) =>{
      const { latitude, longitude } = res.coords;
      this.deviceLocation = L.latLng(latitude, longitude);
      this.map.setView(this.deviceLocation, this.map.getZoom());
      this.SetRouting({ latitude: latitude, longitude: longitude });
    }).catch(async (error) =>{
      console.log(error,"error")
    })

  }
  async gotoCurrentLoc() {
    const { coords } = await Geolocation.getCurrentPosition({
      enableHighAccuracy: true,
    });
    const { latitude, longitude } = coords;
    this.deviceLocation = L.latLng(latitude, longitude);
    this.map.setView(this.deviceLocation, 20);
  }
  goBack() {
    this.navCtrl.back();
  }
}
