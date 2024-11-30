import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { StaffviewTableOrderComponent } from './staffview-table-order.component';
import { OrderprocessingComponent } from './orderprocessing/orderprocessing.component';
import { TableorderStaffComponent } from './tableorder-staff/tableorder-staff.component';
import { RoleGuardService } from '../../../../service/authService/RoleGuard.service';

const routes: Routes = [{
    path: '', component: StaffviewTableOrderComponent, children: [

      { path: 'orderprocessing/:idOrder/:idTable', component : OrderprocessingComponent ,canActivate:[RoleGuardService], data:{expectedRole :["STAFF","MANAGER"]}  },
      { path: 'orderprocessing/:idOrder/:idTable/:reload', component : OrderprocessingComponent ,canActivate:[RoleGuardService], data:{expectedRole :["STAFF","MANAGER"]}  },
      { path: 'orderprocessing/:idTable', component : OrderprocessingComponent ,canActivate:[RoleGuardService], data:{expectedRole :["STAFF","MANAGER"]}  },
      { path: 'tableorder', component : TableorderStaffComponent ,canActivate:[RoleGuardService], data:{expectedRole :["STAFF","MANAGER"]}   },
      
     ]
  }];
  
  @NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
  })
  export class StaffviewTableOrderRoutingModule { }
  