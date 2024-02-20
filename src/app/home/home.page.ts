import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { Storage } from '@ionic/storage-angular';
import { GeocodingService } from 'src/providers/GeocodingServices';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage {
  voters={first_name:"Bhagwan Sahay",
  last_name: "Jangid", 
  address: "Goner Road Jaipur", 
  postal_code: "302031",
  latitude: "26.8531",
  longitude: "75.8697"
}
  constructor( private router: Router,
    public storage: Storage,
    private geoServices: GeocodingService,
    ) {storage.create()}
  openMap(item:any) {
    let address = item.address + " " + item.postal_code
    if(item?.latitude && item?.longitude){
      const data ={latitude: item.latitude, longitude: item.longitude, address:address }
      this.storage.set('selectedDestination', data)
      this.router.navigate(['map-view'])
    }
    else{
      this.geoServices.geocodeAddress(address).subscribe(res => {
        const data ={latitude: res.latitude, longitude: res.longitude, address:address }
        this.storage.set('selectedDestination', data)
        this.router.navigate(['map-view'])
      })
    }
  }
}
