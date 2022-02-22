use crate::pixels::SharedPixels;
use tonic::{Request, Response, Status};
use tracing::instrument;

mod pb {
    tonic::include_proto!("lights");
}

use pb::{
    controller_server::{Controller, ControllerServer},
    AnimationStatus, BrightnessArgs, Color, Empty, RegisterAnimationArgs, SetAllArgs, SetArgs,
    StartAnimationArgs, UnregisterAnimationArgs,
};

/// Ensure the provided value is in the range and cast to the specified type. If only a type is
/// passed, then the maximum value is defined by the type.
macro_rules! in_range {
    ($value:expr, $type:ty) => {
        in_range!($value, <$type>::MAX, $type)
    };
    ($value:expr, $max:expr, $result_type:ty) => {
        if $value > $max as u32 {
            return Err(Status::out_of_range(format!(
                "must be between 0 and {}",
                $max
            )));
        } else {
            $value as $result_type
        }
    };
}

pub type Service = ControllerServer<ControllerService>;

/// Create an instance of the service implementation to run
pub fn service(pixels: SharedPixels) -> Service {
    ControllerServer::new(ControllerService { pixels })
}

/// The implementation of the controller
#[derive(Debug)]
pub struct ControllerService {
    pixels: SharedPixels,
}

#[tonic::async_trait]
impl Controller for ControllerService {
    #[instrument(skip(self))]
    async fn set(&self, request: Request<SetArgs>) -> Result<Response<Empty>, Status> {
        // Extract the arguments
        let args = request.into_inner();
        let color = args
            .color
            .ok_or(Status::invalid_argument("missing argument 'color'"))?;
        let r = in_range!(color.r, u8);
        let g = in_range!(color.g, u8);
        let b = in_range!(color.b, u8);

        // Set the desired indexes
        let mut pixels = self.pixels.lock().await;
        for index in args.indexes {
            let index = in_range!(index, pixels.length, u16);
            pixels.set(index, r, g, b);
        }

        // Commit the changes
        pixels.show();

        Ok(Response::new(Empty {}))
    }

    #[instrument(skip(self))]
    async fn set_all(&self, request: Request<SetAllArgs>) -> Result<Response<Empty>, Status> {
        Err(Status::unimplemented("not yet implemented"))
    }

    #[instrument(skip(self))]
    async fn fill(&self, request: Request<Color>) -> Result<Response<Empty>, Status> {
        Err(Status::unimplemented("not yet implemented"))
    }

    #[instrument(skip(self))]
    async fn brightness(
        &self,
        request: Request<BrightnessArgs>,
    ) -> Result<Response<Empty>, Status> {
        Err(Status::unimplemented("not yet implemented"))
    }

    #[instrument(skip(self))]
    async fn start_animation(
        &self,
        request: Request<StartAnimationArgs>,
    ) -> Result<Response<Empty>, Status> {
        Err(Status::unimplemented("not yet implemented"))
    }

    #[instrument(skip(self))]
    async fn stop_animation(&self, request: Request<Empty>) -> Result<Response<Empty>, Status> {
        Err(Status::unimplemented("not yet implemented"))
    }

    #[instrument(skip(self))]
    async fn register_animation(
        &self,
        request: Request<RegisterAnimationArgs>,
    ) -> Result<Response<AnimationStatus>, Status> {
        Err(Status::unimplemented("not yet implemented"))
    }

    #[instrument(skip(self))]
    async fn unregister_animation(
        &self,
        request: Request<UnregisterAnimationArgs>,
    ) -> Result<Response<Empty>, Status> {
        Err(Status::unimplemented("not yet implemented"))
    }
}
