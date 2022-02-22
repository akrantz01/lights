use tonic::{Request, Response, Status};

mod pb {
    tonic::include_proto!("lights");
}

use pb::{
    controller_server::{Controller, ControllerServer},
    AnimationStatus, BrightnessArgs, Color, Empty, RegisterAnimationArgs, SetAllArgs, SetArgs,
    StartAnimationArgs, UnregisterAnimationArgs,
};

/// Create an instance of the service implementation to run
pub fn service() -> ControllerServer<ControllerService> {
    let controller = ControllerService::default();
    ControllerServer::new(controller)
}

/// The implementation of the controller
#[derive(Debug, Default)]
pub struct ControllerService;

#[tonic::async_trait]
impl Controller for ControllerService {
    async fn set(&self, request: Request<SetArgs>) -> Result<Response<Empty>, Status> {
        todo!()
    }

    async fn set_all(&self, request: Request<SetAllArgs>) -> Result<Response<Empty>, Status> {
        todo!()
    }

    async fn fill(&self, request: Request<Color>) -> Result<Response<Empty>, Status> {
        todo!()
    }

    async fn brightness(
        &self,
        request: Request<BrightnessArgs>,
    ) -> Result<Response<Empty>, Status> {
        todo!()
    }

    async fn start_animation(
        &self,
        request: Request<StartAnimationArgs>,
    ) -> Result<Response<Empty>, Status> {
        todo!()
    }

    async fn stop_animation(&self, request: Request<Empty>) -> Result<Response<Empty>, Status> {
        todo!()
    }

    async fn register_animation(
        &self,
        request: Request<RegisterAnimationArgs>,
    ) -> Result<Response<AnimationStatus>, Status> {
        todo!()
    }

    async fn unregister_animation(
        &self,
        request: Request<UnregisterAnimationArgs>,
    ) -> Result<Response<Empty>, Status> {
        todo!()
    }
}
